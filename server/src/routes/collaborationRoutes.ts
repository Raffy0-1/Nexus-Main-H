import express from 'express';
import { submitCollaborationRequest, getMyCollaborations, updateCollaborationStatus } from '../controllers/collaborationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, submitCollaborationRequest)
  .get(protect, getMyCollaborations);

router.route('/:id/status')
  .put(protect, updateCollaborationStatus);

export default router;
