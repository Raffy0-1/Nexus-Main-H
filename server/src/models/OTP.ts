import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  userId: string;
  code: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  code: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete document after 10 minutes (600 seconds)
  }
});

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
