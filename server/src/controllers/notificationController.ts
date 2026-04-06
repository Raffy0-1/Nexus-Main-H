import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export const createNotification = async (userId: string, type: string, message: string, senderId?: string, data?: any) => {
  try {
    await Notification.create({
      user: new mongoose.Types.ObjectId(userId),
      type,
      content: message,
      sender: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
      data,
      unread: true
    } as any);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const notifications = await Notification.find({ user: authReq.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName');
      
    const formatted = notifications.map(n => ({
      ...n.toObject(),
      user: n.sender ? {
        name: `${(n.sender as any).firstName} ${(n.sender as any).lastName}`,
        avatar: `https://ui-avatars.com/api/?name=${(n.sender as any).firstName}+${(n.sender as any).lastName}&background=random`
      } : { name: 'System', avatar: 'https://ui-avatars.com/api/?name=System' }
    }));
    
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    await Notification.updateMany(
      { user: authReq.user._id, unread: true },
      { $set: { unread: false } }
    );
    
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, user: authReq.user._id },
      { $set: { unread: false } }
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};
