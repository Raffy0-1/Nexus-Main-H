import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';
import Stripe from 'stripe';

const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY || 'sk_test_some_mock_key', {
  apiVersion: '2023-10-16',
});

export const processDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { amount } = req.body;
    
    if (amount <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0' });
      return;
    }

    // Since Stripe cannot be set up, entirely mock the gateway response locally!
    const transaction = await Transaction.create({
      user: authReq.user._id,
      type: 'deposit',
      amount,
      status: 'completed',
      reference: `MOCK_DEP_${Date.now()}`
    });

    res.status(200).json({
      clientSecret: 'mock_client_secret_no_stripe_required',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

export const processWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { amount, destination } = req.body;
    
    const transaction = await Transaction.create({
      user: authReq.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      reference: `MOCK_WD_${Date.now()}`
    });

    res.status(200).json(transaction);
  } catch (error) {
    next(error);
  }
};

// NEW: Transfer functionality between users
export const processTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { amount, destinationUserId } = req.body;

    if (!destinationUserId || !amount) {
      res.status(400).json({ message: 'Destination user and amount are required' });
      return;
    }

    const transaction = await Transaction.create({
      user: authReq.user._id,
      type: 'transfer',
      amount,
      status: 'completed', // Using completed for mock purposes
      reference: `MOCK_TX_${Date.now()}`
    });

    res.status(200).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const history = await Transaction.find({ user: authReq.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};