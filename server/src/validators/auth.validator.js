const { z } = require('zod');

const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    deviceId: z.string().optional(),
    deviceType: z.string().optional(),
  }),
});

const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token required'),
    deviceId: z.string().optional(),
    deviceType: z.string().optional(),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
});

module.exports = { sendOtpSchema, verifyOtpSchema, googleAuthSchema, refreshTokenSchema };
