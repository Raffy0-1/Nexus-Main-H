import express from 'express';
import { 
  processDeposit, 
  processWithdrawal, 
  processTransfer, 
  getTransactionHistory 
} from '../controllers/paymentController';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { validateRequest, paymentSchema } from '../middleware/validationMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/payments/deposit:
 *   post:
 *     summary: Process a deposit (Mock)
 *     tags: [Payments]
 */
router.route('/deposit').post(protect, validateRequest(paymentSchema), processDeposit);

/**
 * @swagger
 * /api/payments/withdraw:
 *   post:
 *     summary: Process a withdrawal (Mock)
 *     tags: [Payments]
 */
router.post('/withdraw', protect, processWithdrawal);

/**
 * @swagger
 * /api/payments/transfer:
 *   post:
 *     summary: Transfer funds between internal accounts
 *     tags: [Payments]
 */
router.post('/transfer', protect, processTransfer);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Payments]
 */
router.route('/history').get(protect, getTransactionHistory);

export default router;