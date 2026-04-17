const WalletService = require('../services/wallet.service');
const { AppError } = require('../middleware/error');

exports.getBalance = async (req, res, next) => {
  try {
    const result = await WalletService.getBalance(req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const result = await WalletService.getTransactions(req.user._id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.addMoney = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return next(new AppError('Invalid amount', 400));
    const wallet = await WalletService.credit(req.user._id, amount, 'Added money to wallet');
    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.withdrawMoney = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return next(new AppError('Invalid amount', 400));
    const wallet = await WalletService.debit(req.user._id, amount, 'Withdrawal from wallet');
    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
