import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  version: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'review', 'signed'], default: 'draft' },
  signatures: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signatureUrl: { type: String },
    signedAt: { type: Date }
  }]
}, { timestamps: true });

export const Document = mongoose.model('Document', documentSchema);
