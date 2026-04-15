const { Payment, Booking, Wallet } = require('../models');
const { getQueue } = require('../config/queue');
const logger = require('../config/logger');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentService {
  /**
   * Create a Razorpay order for a booking.
   */
  static async createBookingOrder(bookingId, userId) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error('Booking not found');
    if (booking.payment.status === 'captured') throw new Error('Already paid');

    const options = {
      amount: Math.round(booking.payment.amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: userId.toString(),
        type: 'booking',
      },
    };

    const order = await razorpay.orders.create(options);

    booking.payment.razorpayOrderId = order.id;
    booking.payment.status = 'created';
    await booking.save();

    const payment = new Payment({
      user: userId,
      booking: bookingId,
      amount: booking.payment.amount,
      currency: 'INR',
      type: 'booking',
      razorpayOrderId: order.id,
      status: 'created',
    });
    await payment.save();

    logger.info({ bookingId, orderId: order.id }, 'Razorpay order created');

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    };
  }

  /**
   * Verify Razorpay payment signature and capture.
   */
  static async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new Error('Invalid payment signature');
    }

    // Update payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw new Error('Payment not found');

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'captured';
    payment.capturedAt = new Date();
    await payment.save();

    // Update booking status
    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        'payment.razorpayPaymentId': razorpayPaymentId,
        'payment.status': 'captured',
        status: 'confirmed',
      });
    }

    logger.info({ paymentId: payment._id, razorpayPaymentId }, 'Payment verified and captured');

    return payment;
  }

  /**
   * Process refund for a booking.
   */
  static async processRefund(bookingId, amount, reason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const payment = await Payment.findOne({
      booking: bookingId,
      status: 'captured',
    });
    if (!payment) throw new Error('No captured payment found for this booking');

    const refundAmount = amount || payment.amount;

    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason, bookingId: bookingId.toString() },
      });

      payment.refund = {
        razorpayRefundId: refund.id,
        amount: refundAmount,
        status: 'processed',
        reason,
        processedAt: new Date(),
      };
      payment.status = 'refunded';
      await payment.save();

      logger.info({ paymentId: payment._id, refundId: refund.id, amount: refundAmount }, 'Refund processed');

      return payment;
    } catch (err) {
      // Queue for retry
      payment.refund = {
        amount: refundAmount,
        status: 'failed',
        reason,
        retryCount: (payment.refund?.retryCount || 0) + 1,
      };
      await payment.save();

      if ((payment.refund.retryCount || 0) < 3) {
        const queue = getQueue('refund');
        await queue.add('retry-refund', {
          bookingId,
          amount: refundAmount,
          reason,
        }, { delay: 60000 * Math.pow(2, payment.refund.retryCount) }); // Exponential backoff
      }

      logger.error({ err, paymentId: payment._id }, 'Refund failed');
      throw err;
    }
  }

  /**
   * Razorpay webhook handler.
   */
  static async handleWebhook(body, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    switch (event) {
      case 'payment.captured': {
        const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (payment && payment.status !== 'captured') {
          payment.status = 'captured';
          payment.razorpayPaymentId = paymentEntity.id;
          payment.capturedAt = new Date();
          await payment.save();

          if (payment.booking) {
            await Booking.findByIdAndUpdate(payment.booking, {
              'payment.status': 'captured',
              status: 'confirmed',
            });
          }
        }
        break;
      }
      case 'payment.failed': {
        const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (payment) {
          payment.status = 'failed';
          await payment.save();
        }
        break;
      }
      case 'refund.processed': {
        const refundEntity = body.payload?.refund?.entity;
        const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
        if (payment) {
          payment.refund.status = 'processed';
          payment.refund.razorpayRefundId = refundEntity.id;
          payment.refund.processedAt = new Date();
          await payment.save();
        }
        break;
      }
    }

    return { received: true };
  }
}

module.exports = PaymentService;
