import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getConversations, getMessagesBetweenUsers, sendMessage } from '../controllers/messageController';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessagesBetweenUsers);
router.post('/', protect, sendMessage);

export default router;
