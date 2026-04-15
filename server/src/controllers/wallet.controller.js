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
