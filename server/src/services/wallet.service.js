const { Wallet, User } = require('../models');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class WalletService {
  static async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
    }
    return wallet;
  }

  static async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return { balance: wallet.balance };
  }

  static async credit(userId, amount, description, reference = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              type: 'credit',
              amount,
              description,
              reference,
              createdAt: new Date(),
            },
          },
        },
        { new: true, upsert: true, session }
      );

      await session.commitTransaction();
      logger.info({ userId, amount, description }, 'Wallet credited');
      return wallet;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async debit(userId, amount, description, reference = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      wallet.balance -= amount;
      wallet.transactions.push({
        type: 'debit',
        amount,
        description,
        reference,
        createdAt: new Date(),
      });

      await wallet.save({ session });
      await session.commitTransaction();
      logger.info({ userId, amount, description }, 'Wallet debited');
      return wallet;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async refund(userId, amount, description, reference) {
    return this.credit(userId, amount, `Refund: ${description}`, reference);
  }

  static async cashback(userId, amount, description, reference) {
    return this.credit(userId, amount, `Cashback: ${description}`, reference);
  }

  static async getTransactions(userId, { page = 1, limit = 20 } = {}) {
    const wallet = await this.getOrCreateWallet(userId);
    const total = wallet.transactions.length;
    const start = Math.max(0, total - page * limit);
    const end = total - (page - 1) * limit;
    const transactions = wallet.transactions.slice(start, end).reverse();
    return { transactions, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = WalletService;
