const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const { User, Wallet } = require('../models');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');
const { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  static generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });
  }

  static generateRefreshToken(userId) {
    return jwt.sign({ userId, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });
  }

  static async sendOtp(phone) {
    // In production, integrate MSG91/Twilio
    // For development, use a fixed OTP
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    const redis = getRedis();
    await redis.set(`otp:${phone}`, otp, 'EX', 300); // 5 min expiry

    if (process.env.NODE_ENV !== 'development') {
      // Send OTP via SMS service
      logger.info(`OTP sent to ${phone}`);
    }

    return { message: 'OTP sent successfully' };
  }

  static async verifyOtp(phone, otp, deviceInfo) {
    const redis = getRedis();
    const storedOtp = await redis.get(`otp:${phone}`);

    if (!storedOtp || storedOtp !== otp) {
      throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
    }

    await redis.del(`otp:${phone}`);

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone,
        name: `Player_${phone.slice(-4)}`,
        isVerified: true,
      });
      // Create wallet for new user
      await Wallet.create({ user: user._id });
    }

    const tokens = await this._generateTokens(user, deviceInfo);
    return { user, tokens, isNewUser };
  }

  static async googleAuth(idToken, deviceInfo) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture,
        isVerified: true,
      });
      await Wallet.create({ user: user._id });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const tokens = await this._generateTokens(user, deviceInfo);
    return { user, tokens, isNewUser };
  }

  static async emailLogin(email, password, deviceInfo) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }
    if (!user.isActive || user.isBanned) {
      throw Object.assign(new Error('Account is suspended'), { statusCode: 403 });
    }
    const tokens = await this._generateTokens(user, deviceInfo);
    user.password = undefined;
    return { user, tokens };
  }

  static async register({ name, email, phone, password, role = 'player' }) {
    // Only allow player or owner self-registration (never admin via API)
    const safeRole = role === 'owner' ? 'owner' : 'player';

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] });
    if (existing) {
      throw Object.assign(new Error('An account with this email or phone already exists'), { statusCode: 409 });
    }

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password,
      role: safeRole,
      isVerified: true,
    });

    await Wallet.create({ user: user._id });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(err =>
      logger.error({ err: err.message }, 'Welcome email failed')
    );

    return { user, message: 'Account created successfully' };
  }

  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists   return success anyway
      return { message: 'If an account exists with this email, you will receive a reset code' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redis = getRedis();
    await redis.set(`pwd_reset:${email}`, otp, 'EX', 600); // 10 min expiry

    await sendPasswordResetEmail(email, otp);

    return { message: 'If an account exists with this email, you will receive a reset code' };
  }

  static async verifyResetOtp(email, otp) {
    const redis = getRedis();
    const storedOtp = await redis.get(`pwd_reset:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
    }
    // Mark OTP as verified   create a reset token
    const resetToken = uuidv4();
    await redis.set(`pwd_reset_verified:${email}`, resetToken, 'EX', 600);
    await redis.del(`pwd_reset:${email}`);
    return { resetToken, message: 'OTP verified' };
  }

  static async resetPassword(email, resetToken, newPassword) {
    const redis = getRedis();
    const storedToken = await redis.get(`pwd_reset_verified:${email}`);
    if (!storedToken || storedToken !== resetToken) {
      throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    user.password = newPassword;
    await user.save();

    await redis.del(`pwd_reset_verified:${email}`);
    return { message: 'Password reset successfully' };
  }

  static async refreshToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('+devices');

    if (!user || !user.isActive) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    // Validate refresh token exists in user's devices
    const device = user.devices.find(d => d.refreshToken === refreshToken);
    if (!device) {
      throw Object.assign(new Error('Refresh token revoked'), { statusCode: 401 });
    }

    const accessToken = this.generateAccessToken(user._id);
    const newRefreshToken = this.generateRefreshToken(user._id);

    device.refreshToken = newRefreshToken;
    device.lastActive = new Date();
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async logout(userId, refreshToken) {
    const user = await User.findById(userId).select('+devices');
    if (user) {
      user.devices = user.devices.filter(d => d.refreshToken !== refreshToken);
      await user.save();
    }
  }

  static async _generateTokens(user, deviceInfo = {}) {
    // Callers may pass a user-agent string instead of an object
    if (typeof deviceInfo === 'string') {
      deviceInfo = { deviceType: deviceInfo };
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    const userWithDevices = await User.findById(user._id).select('+devices');

    // Add or update device
    const existingDeviceIdx = userWithDevices.devices.findIndex(
      d => d.deviceId === deviceInfo.deviceId
    );

    if (existingDeviceIdx >= 0) {
      userWithDevices.devices[existingDeviceIdx].refreshToken = refreshToken;
      userWithDevices.devices[existingDeviceIdx].lastActive = new Date();
    } else {
      // Limit to 5 devices
      if (userWithDevices.devices.length >= 5) {
        userWithDevices.devices.shift();
      }
      userWithDevices.devices.push({
        deviceId: deviceInfo.deviceId || uuidv4(),
        deviceType: deviceInfo.deviceType || 'unknown',
        lastActive: new Date(),
        refreshToken,
      });
    }

    await userWithDevices.save();

    return { accessToken, refreshToken };
  }
}

module.exports = AuthService;
