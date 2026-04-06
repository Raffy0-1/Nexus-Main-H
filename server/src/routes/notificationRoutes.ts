import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markRead, markNotificationRead } from '../controllers/notificationController';

const router = express.Router();

router.get('/', protect as any, getNotifications);
router.put('/mark-read', protect as any, markRead);
router.put('/:id/read', protect as any, markNotificationRead);

export default router;
