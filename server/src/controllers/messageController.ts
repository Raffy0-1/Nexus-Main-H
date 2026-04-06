import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { Profile } from '../models/Profile';
import { User } from '../models/User';
import { createNotification } from './notificationController';

export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user._id;
    
    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 }).populate('senderId receiverId', 'firstName lastName avatarUrl email role isOnline');

    // Group into conversations by the 'other' user
    const conversationMap = new Map();
    
    for (const msg of messages) {
      const sender = msg.senderId as any;
      const receiver = msg.receiverId as any;
      
      const isSender = sender._id.toString() === userId.toString();
      const otherUser = isSender ? receiver : sender;
      
      if (!conversationMap.has(otherUser._id.toString())) {
        const unreadCount = !isSender && !msg.read ? 1 : 0;
        
        conversationMap.set(otherUser._id.toString(), {
          // Shape matching ChatConversation type used by ChatUserList
          id: `${userId.toString()}_${otherUser._id.toString()}`,
          // participants array is required by ChatUserList to find the "other" user
          participants: [userId.toString(), otherUser._id.toString()],
          user: {
            id: otherUser._id.toString(),
            name: `${otherUser.firstName} ${otherUser.lastName}`,
            avatarUrl: otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser.firstName}+${otherUser.lastName}&background=random`,
            isOnline: otherUser.isOnline || false
          },
          lastMessage: {
            id: (msg as any)._id.toString(),
            senderId: sender._id.toString(),
            receiverId: receiver._id.toString(),
            content: msg.content,
            // "timestamp" is what the frontend ChatConversation type uses
            timestamp: (msg as any).createdAt,
            isRead: msg.read
          },
          unreadCount,
          updatedAt: (msg as any).createdAt
        });
      } else {
        if (!isSender && !msg.read) {
          conversationMap.get(otherUser._id.toString()).unreadCount += 1;
        }
      }
    }
    
    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    next(error);
  }
};

export const getMessagesBetweenUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { userId } = req.params;
    const currentUserId = authReq.user._id;
    
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    } as any).sort({ createdAt: 1 });
    
    // Mark received messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, read: false } as any,
      { $set: { read: true } }
    );
    
    // Normalize field names: DB uses `read` + `createdAt`, frontend Message type uses `isRead` + `timestamp`
    const normalized = (messages as any[]).map((m: any) => ({
      id: m._id.toString(),
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      content: m.content,
      timestamp: m.createdAt,
      isRead: m.read,
      createdAt: m.createdAt
    }));
    
    res.json(normalized);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { receiverId, content } = req.body;
    
    const message = await Message.create({
      senderId: authReq.user._id,
      receiverId,
      content,
    });
    
    // Notify the receiver
    await createNotification(receiverId, 'new_message', `New message from ${authReq.user.firstName}`, authReq.user._id.toString(), { messageId: message._id });

    // Return normalized shape so the frontend can use it immediately
    res.status(201).json({
      id: (message as any)._id.toString(),
      _id: (message as any)._id.toString(),
      senderId: authReq.user._id.toString(),
      receiverId,
      content: message.content,
      timestamp: (message as any).createdAt,
      isRead: false,
      createdAt: (message as any).createdAt
    });
  } catch (error) {
    next(error);
  }
};
