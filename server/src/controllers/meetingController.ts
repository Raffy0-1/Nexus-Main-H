import { Request, Response, NextFunction } from 'express';
import { Meeting } from '../models/Meeting';
import { AuthRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { createNotification } from './notificationController';

export const createMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { attendeeId, title, description, startTime, endTime } = req.body;
    
    // Conflict detection — only block if the SAME user has overlapping accepted/pending meetings
    const overlappingMeetings = await Meeting.find({
      $or: [
         {
           $or: [{ organizer: authReq.user._id }, { attendee: authReq.user._id }],
           status: { $in: ['pending', 'accepted'] }
         },
         {
           $or: [{ organizer: attendeeId }, { attendee: attendeeId }],
           status: { $in: ['pending', 'accepted'] }
         }
      ],
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    });

    if (overlappingMeetings.length > 0) {
      res.status(409).json({ message: 'Meeting conflict detected (Double booking)' });
      return;
    }

    const roomId = crypto.randomUUID();
    const meetingLink = `${process.env.FRONTEND_URL}/meetings/room/${roomId}`;

    const meeting = await Meeting.create({
      organizer: authReq.user._id,
      attendee: attendeeId,
      title,
      description,
      startTime,
      endTime,
      roomId,
      meetingLink
    });

    // Notify the attendee
    await createNotification(attendeeId, 'meeting_request', `New meeting request: ${title}`, authReq.user._id.toString(), { meetingId: meeting._id });

    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const meetings = await Meeting.find({
      $or: [{ organizer: authReq.user._id }, { attendee: authReq.user._id }]
    }).populate('organizer', 'firstName lastName email').populate('attendee', 'firstName lastName email');
    
    res.json(meetings);
  } catch (error) {
    next(error);
  }
};

export const updateMeetingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { status } = req.body;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.organizer.toString() !== authReq.user._id.toString() && meeting.attendee.toString() !== authReq.user._id.toString()) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    meeting.status = status;
    await meeting.save();

    // Notify the organizer if attendee changed status
    if (meeting.attendee.toString() === authReq.user._id.toString()) {
      const action = status === 'accepted' ? 'accepted' : 'rejected';
      await createNotification(meeting.organizer.toString(), 'meeting_response', `Meeting "${meeting.title}" has been ${action}`, authReq.user._id.toString(), { meetingId: meeting._id });
    }

    res.json(meeting);
  } catch (error) {
     next(error);
  }
};
