import mongoose, { Schema, Document } from 'mongoose';

export interface ICollaboration extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const collaborationSchema = new Schema<ICollaboration>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Prevent duplicate pending requests between the same users
collaborationSchema.index({ senderId: 1, receiverId: 1, status: 1 });

export const Collaboration = mongoose.model<ICollaboration>('Collaboration', collaborationSchema);
