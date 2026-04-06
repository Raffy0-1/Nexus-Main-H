import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String, default: '' },
  title: { type: String, default: '' }, // e.g. Founder at X, Partner at Y
  company: { type: String, default: '' },
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  preferences: {
    industries: [{ type: String }],
    investmentStage: [{ type: String }]
  },
  history: { type: String, default: '' }, // Startup/investment history
}, { timestamps: true });

export const Profile = mongoose.model('Profile', profileSchema);
