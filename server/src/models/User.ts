import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['investor', 'entrepreneur'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
