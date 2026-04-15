const PaymentService = require('../services/payment.service');
const { AppError } = require('../middleware/error');

exports.createBookingOrder = async (req, res, next) => {
  try {
    const order = await PaymentService.createBookingOrder(req.params.bookingId, req.user._id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const payment = await PaymentService.verifyPayment(req.body);
    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await PaymentService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
