import { Request, Response, NextFunction } from 'express';
import { Document } from '../models/Document';
import { AuthRequest } from '../middleware/authMiddleware';
import fs from 'fs/promises';
import path from 'path';
import { createNotification } from './notificationController';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { title } = req.body;
    
    // In a real app we'd upload to S3. Here we mock via a local /uploads path or static URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const document = await Document.create({
      uploader: authReq.user._id,
      title: title || req.file.originalname,
      fileUrl
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const documents = await Document.find({ uploader: authReq.user._id }).populate('uploader', 'firstName lastName');
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

export const signDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { signatureUrl } = req.body; // base64 or URL

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    document.signatures.push({
      user: authReq.user._id,
      signatureUrl,
      signedAt: new Date()
    });

    if (document.status === 'draft') {
      document.status = 'review';
    }

    await document.save();
    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }
    
    // Check if user owns document
    if (document.uploader.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this document' });
      return;
    }
    
    // Actually delete the physical file
    const filePath = path.join(__dirname, '../../', document.fileUrl);
    try {
      await fs.unlink(filePath);
    } catch (fsError: any) {
      console.warn(`Could not delete file ${filePath}: ${fsError.message}`);
    }
    
    await Document.deleteOne({ _id: document._id });
    
    res.json({ message: 'Document removed' });
  } catch (error) {
    next(error);
  }
};

export const shareDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.uploader.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to share this document' });
      return;
    }

    // Notify the recipient
    await createNotification(userId, 'document_shared', `Document "${document.title}" has been shared with you`, authReq.user._id.toString(), { documentId: document._id });

    res.json({ message: 'Document shared successfully' });
  } catch (error) {
    next(error);
  }
};
