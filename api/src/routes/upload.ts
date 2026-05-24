import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate, requireApproved);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME || 'lingering-glade-2094';

// POST /api/upload/presigned
router.post('/presigned', async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, contentType, isPublic } = req.body;
    if (!fileName || !contentType) {
      res.status(400).json({ success: false, message: 'fileName and contentType required' }); return;
    }
    const key = `plaasboek/${req.user!.id}/${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ success: true, url, key });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/upload/multipart/initiate
router.post('/multipart/initiate', async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, isPublic } = req.body;
    const key = `plaasboek/${req.user!.id}/${uuidv4()}-${fileName}`;
    const command = new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: key });
    const result = await s3.send(command);
    res.json({ success: true, uploadId: result.UploadId, key });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/upload/multipart/part
router.post('/multipart/part', async (req: AuthRequest, res: Response) => {
  try {
    const { cloud_storage_path, uploadId, partNumber } = req.body;
    const command = new UploadPartCommand({ Bucket: BUCKET, Key: cloud_storage_path, UploadId: uploadId, PartNumber: partNumber });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ success: true, url });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/upload/multipart/complete
router.post('/multipart/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { cloud_storage_path, uploadId, parts } = req.body;
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET, Key: cloud_storage_path, UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await s3.send(command);
    res.json({ success: true, key: cloud_storage_path });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/files/:path/url
router.get('/files/:path/url', async (req: AuthRequest, res: Response) => {
  try {
    const { mode = 'view' } = req.query as any;
    const key = decodeURIComponent(req.params.path);
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: mode === 'download' ? 300 : 3600 });
    res.json({ success: true, url });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/files/:id
router.delete('/files/:id', async (req: AuthRequest, res: Response) => {
  try {
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: req.params.id });
    await s3.send(command);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
