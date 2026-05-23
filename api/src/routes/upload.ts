import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export const uploadRouter = Router();

// Cloudflare R2 — S3-compatible, zero egress fees
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'vcds-uploads';

// POST /api/upload/presigned
uploadRouter.post('/presigned', authenticate, async (req: AuthRequest, res: Response) => {
  const { fileName, contentType = 'image/jpeg', folder = 'uploads' } = req.body;
  const key = `${folder}/${req.user!.userId}/${uuidv4()}-${fileName}`;
  try {
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    return res.json({ success: true, uploadUrl, key });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/upload/complete
uploadRouter.post('/complete', authenticate, async (req: AuthRequest, res: Response) => {
  const { key } = req.body;
  try {
    if (process.env.R2_PUBLIC_URL) {
      return res.json({ success: true, viewUrl: `${process.env.R2_PUBLIC_URL}/${key}`, key });
    }
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const viewUrl = await getSignedUrl(r2, command, { expiresIn: 86400 * 7 });
    return res.json({ success: true, viewUrl, key });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});
