const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: `"Athleon" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info({ to, messageId: info.messageId }, 'Email sent');
    return info;
  } catch (err) {
    logger.error({ to, err: err.message }, 'Email send failed');
    throw err;
  }
}

async function sendOtpEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: 'Athleon - Your Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">A</div>
          <h1 style="margin: 12px 0 0; color: #1e293b; font-size: 22px;">Athleon</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">Your verification code is:</p>
          <div style="text-align: center; padding: 16px; background: #f1f5f9; border-radius: 8px; margin-bottom: 16px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: 'Athleon - Reset Your Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">A</div>
          <h1 style="margin: 12px 0 0; color: #1e293b; font-size: 22px;">Athleon</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 18px;">Password Reset</h2>
          <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">Use this code to reset your password:</p>
          <div style="text-align: center; padding: 16px; background: #fef2f2; border-radius: 8px; margin-bottom: 16px; border: 1px solid #fecaca;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc2626;">${otp}</span>
          </div>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">This code expires in 10 minutes. If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendWelcomeEmail(email, name) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Athleon!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">A</div>
          <h1 style="margin: 12px 0 0; color: #1e293b; font-size: 22px;">Welcome to Athleon!</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">Hey ${name},</p>
          <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">Your account has been created successfully. You can now:</p>
          <ul style="color: #475569; font-size: 14px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Browse and book sports venues near you</li>
            <li style="margin-bottom: 8px;">Join activities and find playing partners</li>
            <li style="margin-bottom: 8px;">Participate in tournaments</li>
            <li style="margin-bottom: 8px;">Track live match scores</li>
          </ul>
          <p style="color: #475569; margin: 16px 0 0; font-size: 15px;">Let's play!</p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail };
