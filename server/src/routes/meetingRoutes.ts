import express from 'express';
import { createMeeting, getMeetings, updateMeetingStatus } from '../controllers/meetingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createMeeting)
  .get(protect, getMeetings);

router.route('/:id/status')
  .put(protect, updateMeetingStatus);

export default router;
