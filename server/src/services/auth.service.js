const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const { User, Wallet } = require('../models');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');
const { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// DEV HELPER: Grant 1-year premium subscription to every new registrant
// TODO: Replace with real subscription/payment flow in MVP 2
function devPremiumSubscription() {
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  return {
    plan: 'premium',
    startDate: now,
    endDate: oneYearLater,
    isActive: true,
    autoRenew: false,
  };
}

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
    const mobile = `91${phone.replace(/^\+91/, '').replace(/^91/, '')}`;

    // Send OTP via MSG91 — MSG91 generates the OTP and injects into the template
    try {
      const body = JSON.stringify({
        template_id: process.env.OTP_TEMPLATE_ID,
        mobile,
      });

      const msg91Response = await new Promise((resolve, reject) => {
        const url = new URL(process.env.OTP_SERVICE_URL);
        logger.info(`[MSG91] Sending OTP to ${mobile}`);

        const req = https.request(
          {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
              'authkey': process.env.OTP_AUTH_KEY,
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              logger.info(`[MSG91] Send response ${res.statusCode}: ${data}`);
              resolve({ statusCode: res.statusCode, body: data });
            });
          }
        );
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('MSG91 request timed out')); });
        req.write(body);
        req.end();
      });

      // MSG91 returns { type: 'success' } or { type: 'error', message: '...' }
      let parsed = {};
      try { parsed = JSON.parse(msg91Response.body); } catch (_) { /* non-JSON response */ }
      if (parsed.type === 'error') {
        throw new Error(parsed.message || `MSG91 error`);
      }
      if (msg91Response.statusCode >= 400) {
        throw new Error(`MSG91 API error: ${msg91Response.statusCode}`);
      }

      logger.info(`[MSG91] OTP sent successfully to ${mobile}`);
    } catch (err) {
      logger.error({ phone, err: err.message }, '[MSG91] Failed to send OTP');
      throw new Error('Failed to send OTP. Please try again.');
    }

    return { message: 'OTP sent successfully' };
  }

  static async verifyOtp(phone, otp, deviceInfo) {
    const mobile = `91${phone.replace(/^\+91/, '').replace(/^91/, '')}`;

    // Verify OTP via MSG91's verify endpoint
    const verifyResponse = await new Promise((resolve, reject) => {
      const path = `/api/v5/otp/verify?mobile=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(otp)}`;
      logger.info(`[MSG91] Verifying OTP for ${mobile}`);

      const req = https.request(
        {
          hostname: 'api.msg91.com',
          path,
          method: 'GET',
          headers: { 'authkey': process.env.OTP_AUTH_KEY },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            logger.info(`[MSG91] Verify response ${res.statusCode}: ${data}`);
            resolve({ statusCode: res.statusCode, body: data });
          });
        }
      );
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('MSG91 verify timed out')); });
      req.end();
    });

    let parsed = {};
    try { parsed = JSON.parse(verifyResponse.body); } catch (_) { /* non-JSON */ }
    if (parsed.type !== 'success') {
      const msg = parsed.message || 'Invalid or expired OTP';
      throw Object.assign(new Error(msg), { statusCode: 400 });
    }

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone,
        name: `Player_${phone.slice(-4)}`,
        isVerified: true,
        subscription: devPremiumSubscription(),
      });
      // Create wallet for new user
      await Wallet.create({ user: user._id });
      logger.info({ userId: user._id, phone }, '[DEV] New user via OTP — granted 1-year premium subscription');
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
        subscription: devPremiumSubscription(),
      });
      await Wallet.create({ user: user._id });
      logger.info({ userId: user._id, email }, '[DEV] New user via Google — granted 1-year premium subscription');
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
      subscription: devPremiumSubscription(),
    });

    await Wallet.create({ user: user._id });
    logger.info({ userId: user._id, email, role: safeRole }, '[DEV] New user via email register — granted 1-year premium subscription');

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
