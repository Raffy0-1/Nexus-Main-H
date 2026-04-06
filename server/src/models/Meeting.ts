import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  roomId: { type: String }, // NEW: WebRTC UUID
  meetingLink: { type: String } // WebRTC room link
}, { timestamps: true });

export const Meeting = mongoose.model('Meeting', meetingSchema);
