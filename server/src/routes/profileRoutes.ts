import express from 'express';
import { getMyProfile, updateMyProfile, getInvestors, getEntrepreneurs, updateMyAvatar, getUserById } from '../controllers/profileController';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { validateRequest, updateProfileSchema } from '../middleware/validationMiddleware';

import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

router.route('/me/avatar')
  .put(protect, upload.single('avatar'), updateMyAvatar);

router.route('/me')
  .get(protect, getMyProfile)
  .put(protect, validateRequest(updateProfileSchema), updateMyProfile);

router.get('/investors', protect, getInvestors);
router.get('/entrepreneurs', protect, getEntrepreneurs);

// Public-style profile lookup — must be LAST to avoid shadowing /me, /investors, /entrepreneurs
router.get('/:id', protect, getUserById);

export default router;
