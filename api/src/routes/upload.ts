import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET = process.env.R2_BUCKET || '';

router.post('/presigned', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileName, contentType, isPublic } = req.body;
    if (!fileName || !contentType) { res.status(400).json({ success: false, message: 'fileName and contentType required' }); return; }
    const key = `plaasboek/${req.user!.id}/${uuidv4()}-${fileName}`;
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ success: true, url, cloud_storage_path: key, isPublic: isPublic||false });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/multipart/initiate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileName, isPublic } = req.body;
    const key = `plaasboek/${req.user!.id}/${uuidv4()}-${fileName}`;
    const cmd = new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: key });
    const result = await s3.send(cmd);
    res.json({ success: true, uploadId: result.UploadId, cloud_storage_path: key });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/multipart/part', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cloud_storage_path, uploadId, partNumber } = req.body;
    const cmd = new UploadPartCommand({ Bucket: BUCKET, Key: cloud_storage_path, UploadId: uploadId, PartNumber: parseInt(partNumber) });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ success: true, url });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/multipart/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cloud_storage_path, uploadId, parts } = req.body;
    const cmd = new CompleteMultipartUploadCommand({ Bucket: BUCKET, Key: cloud_storage_path, UploadId: uploadId, MultipartUpload: { Parts: parts } });
    await s3.send(cmd);
    res.json({ success: true, cloud_storage_path });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/files/:path/url', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode = 'view' } = req.query as any;
    const key = decodeURIComponent(req.params.path);
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: mode === 'download' ? 300 : 3600 });
    res.json({ success: true, url });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/files/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const photo = await pool.query('SELECT cloud_storage_path FROM journal_photos WHERE id=$1', [req.params.id]);
    if (photo.rows.length) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: photo.rows[0].cloud_storage_path }));
      await pool.query('DELETE FROM journal_photos WHERE id=$1', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
