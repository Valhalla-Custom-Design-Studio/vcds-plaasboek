import { Router, Response } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';
import crypto from 'crypto';
import path from 'path';

const uploadRouter = Router();
uploadRouter.use(authenticate);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/upload/journal/:entryId
uploadRouter.post('/journal/:entryId', upload.single('photo'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file provided' }); return; }
  try {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const key = `journal/${req.user!.id}/${req.params.entryId}/${crypto.randomUUID()}${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    await pool.query(
      'INSERT INTO journal_photos (journal_entry_id, cloud_storage_path) VALUES ($1, $2)',
      [req.params.entryId, publicUrl]
    );
    res.json({ success: true, url: publicUrl, key });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/upload/journal/photo/:photoId
uploadRouter.delete('/journal/photo/:photoId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM journal_photos WHERE id = $1 AND journal_entry_id IN (SELECT id FROM journal_entries WHERE user_id = $2) RETURNING *',
      [req.params.photoId, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Photo not found' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default uploadRouter;
