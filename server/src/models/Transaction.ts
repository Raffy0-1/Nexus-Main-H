import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reference: { type: String }
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
