const AuthService = require('../services/auth.service');
const { AppError } = require('../middleware/error');

exports.emailLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Email and password required', 400));
    const userAgent = req.headers['user-agent'] || '';
    const result = await AuthService.emailLogin(email, password, userAgent);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const result = await AuthService.sendOtp(req.body.phone);
    res.status(200).json({ success: true, message: 'OTP sent', data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const result = await AuthService.verifyOtp(phone, otp, userAgent);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const result = await AuthService.googleAuth(req.body.idToken, userAgent);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const result = await AuthService.refreshAccessToken(req.body.refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};

exports.logout = async (req, res, next) => {
  try {
    await AuthService.logout(req.user._id, req.body.refreshToken);
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.me = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};
