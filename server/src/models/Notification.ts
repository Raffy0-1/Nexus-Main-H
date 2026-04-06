import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  content: string;
  sender?: mongoose.Types.ObjectId;
  unread: boolean;
  createdAt: Date;
}

const notificationSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    unread: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
