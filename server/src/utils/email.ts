import nodemailer from 'nodemailer';

/**
 * Checks whether SMTP is actually configured with real (non-placeholder) credentials.
 * If not, falls back to printing the OTP/token to the server console.
 */
const isSmtpConfigured = (): boolean => {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return !!(
    process.env.SMTP_HOST &&
    user &&
    pass &&
    user !== 'your-email@gmail.com' &&
    pass !== 'your-app-password'
  );
};

export const sendEmailOTP = async (to: string, otp: string): Promise<void> => {
  if (!isSmtpConfigured()) {
    // ── DEMO / DEV MODE: Print OTP to server console ──────────────────────
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║       NEXUS DEMO — 2FA OTP CODE          ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  To:   ${to.padEnd(34)}║`);
    console.log(`║  Code: ${otp.padEnd(34)}║`);
    console.log('║  (Expires in 10 minutes)                 ║');
    console.log('╚══════════════════════════════════════════╝\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Nexus Security" <security@nexus-platform.com>',
      to,
      subject: 'Your Nexus 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nexus Platform Security</h2>
          <p>You requested to log in. Here is your two-factor authentication code:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Still log it so dev can proceed
    console.log(`\n[FALLBACK] OTP for ${to}: ${otp}\n`);
  }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string): Promise<void> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  if (!isSmtpConfigured()) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║    NEXUS DEMO — PASSWORD RESET LINK      ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  To:   ${to.padEnd(34)}║`);
    console.log(`║  Link: ${resetLink.substring(0, 34).padEnd(34)}║`);
    console.log('║  (Expires in 15 minutes)                 ║');
    console.log('╚══════════════════════════════════════════╝\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Nexus Security" <security@nexus-platform.com>',
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.log(`\n[FALLBACK] Reset link for ${to}: ${resetLink}\n`);
  }
};