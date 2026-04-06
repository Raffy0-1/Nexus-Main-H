import express from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword, changePassword } from '../controllers/authController';
import { requestOTP, verifyOTP } from '../controllers/twoFactorController';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validationMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect as any, changePassword);

export default router;
