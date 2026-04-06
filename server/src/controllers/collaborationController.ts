import { Request, Response, NextFunction } from 'express';
import { Collaboration } from '../models/Collaboration';
import { AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from './notificationController';

export const submitCollaborationRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { receiverId, message } = req.body;

    if (!receiverId) {
      res.status(400).json({ message: 'Receiver ID is required' });
      return;
    }

    if (authReq.user._id.toString() === receiverId) {
      res.status(400).json({ message: 'You cannot send a request to yourself' });
      return;
    }

    const existingRequest = await Collaboration.findOne({
      senderId: authReq.user._id,
      receiverId,
      status: 'pending'
    });

    if (existingRequest) {
      res.status(409).json({ message: 'A pending collaboration request already exists' });
      return;
    }

    const newCollab = await Collaboration.create({
      senderId: authReq.user._id,
      receiverId,
      message
    });

    // Notify the receiver
    await createNotification(receiverId, 'collaboration_request', `New collaboration request from ${authReq.user.firstName}`, authReq.user._id.toString(), { collaborationId: newCollab._id });

    res.status(201).json(newCollab);
  } catch (error) {
    next(error);
  }
};

export const getMyCollaborations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const collaborations = await Collaboration.find({
      $or: [{ senderId: authReq.user._id }, { receiverId: authReq.user._id }]
    })
      .populate('senderId', 'firstName lastName avatarUrl')
      .populate('receiverId', 'firstName lastName avatarUrl')
      .sort({ createdAt: -1 });

    res.json(collaborations);
  } catch (error) {
    next(error);
  }
};

export const updateCollaborationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const collab = await Collaboration.findById(id);

    if (!collab) {
      res.status(404).json({ message: 'Collaboration request not found' });
      return;
    }

    if (collab.receiverId.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: 'You are not authorized to update this request' });
      return;
    }

    collab.status = status;
    await collab.save();

    // Notify the sender
    const action = status === 'accepted' ? 'accepted' : 'rejected';
    await createNotification(collab.senderId.toString(), 'collaboration_response', `Your collaboration request has been ${action}`, authReq.user._id.toString(), { collaborationId: collab._id });

    res.json(collab);
  } catch (error) {
    next(error);
  }
};
