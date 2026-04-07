import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import { uploadDocument, getDocuments, signDocument, deleteDocument, shareDocument } from '../controllers/documentController';
import { protect } from '../middleware/authMiddleware';
import fs from 'fs';

const router = express.Router();

let upload: multer.Multer;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      key: function (req: any, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
      }
    })
  });
} else {
  // Local fallback for local dev
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = 'uploads/';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename(req: any, file, cb) {
      cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
  });
  upload = multer({ storage });
}

router.route('/')
  .post(protect, upload.single('document'), uploadDocument)
  .get(protect, getDocuments);

router.route('/:id/sign')
  .put(protect, signDocument);

router.route('/:id/share')
  .post(protect, shareDocument);

router.route('/:id')
  .delete(protect, deleteDocument);

export default router;
