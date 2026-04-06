import { Request, Response, NextFunction } from 'express';
import { sendEmailOTP } from '../utils/email';
import { OTP } from '../models/OTP';
import { User } from '../models/User';

// Detect if SMTP is using real credentials
const isDemoMode = (): boolean => {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return !(
    process.env.SMTP_HOST &&
    user &&
    pass &&
    user !== 'your-email@gmail.com' &&
    pass !== 'your-app-password'
  );
};

export const requestOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate a 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear any existing OTP for this user
    await OTP.deleteMany({ userId: user._id.toString() });

    // Store with 10-minute expiration via Mongoose TTL
    await OTP.create({
      userId: user._id.toString(),
      code: otpCode
    });

    // Send the email (or log to console in demo mode)
    await sendEmailOTP(email, otpCode);

    // In demo mode, return the OTP in the response so the frontend can show it
    if (isDemoMode()) {
      res.status(200).json({
        message: 'Demo mode: OTP printed to server console.',
        demoOtp: otpCode,   // Only exposed when SMTP is not configured
        demoMode: true
      });
    } else {
      res.status(200).json({ message: 'OTP sent successfully. Please check your email.' });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const storedOTP = await OTP.findOne({ userId: user._id.toString(), code: otp });

    if (!storedOTP) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    // Success - clear the OTP
    await OTP.deleteOne({ _id: storedOTP._id });

    res.status(200).json({ message: '2FA verification successful', verified: true, userId: user._id });
  } catch (error) {
    next(error);
  }
};