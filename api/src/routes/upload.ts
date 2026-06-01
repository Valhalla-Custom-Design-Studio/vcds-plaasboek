import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { pool } from '../db/pool';
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

const BUCKET = process.env.R2_BUCKET_NAME!;

// Get presigned upload URL
router.post('/presigned', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) { res.status(400).json({ success: false, message: 'filename and contentType required' }); return; }
    const key = `${req.user!.id}/${uuidv4()}-${filename}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ success: true, url, key });
  } catch (err) {
    console.error('Presigned URL error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
});

// Initiate multipart upload
router.post('/multipart/initiate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filename, contentType } = req.body;
    const key = `${req.user!.id}/${uuidv4()}-${filename}`;
    const command = new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const result = await s3.send(command);
    res.json({ success: true, uploadId: result.UploadId, key });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Multipart initiate failed' });
  }
});

// Get presigned URL for a part
router.post('/multipart/part', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, uploadId, partNumber } = req.body;
    const command = new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Part URL failed' });
  }
});

// Complete multipart upload
router.post('/multipart/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, uploadId, parts, originalName, mimeType, sizeBytes } = req.body;
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET, Key: key, UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await s3.send(command);
    await pool.query(
      'INSERT INTO uploaded_files (user_id, r2_key, original_name, mime_type, size_bytes) VALUES ($1,$2,$3,$4,$5)',
      [req.user!.id, key, originalName || key, mimeType || 'application/octet-stream', sizeBytes || 0]
    );
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Multipart complete failed' });
  }
});

// Get signed download URL  -  wildcard to handle paths with slashes
router.get('/files/url', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;
    if (!key) { res.status(400).json({ success: false, message: 'key query param required' }); return; }
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get file URL' });
  }
});

// Delete file
router.delete('/files/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fileResult = await pool.query('SELECT * FROM uploaded_files WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    if (!fileResult.rows.length) { res.status(404).json({ success: false, message: 'File not found' }); return; }
    const file = fileResult.rows[0];
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file.r2_key }));
    await pool.query('DELETE FROM uploaded_files WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// List user files
router.get('/files', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM uploaded_files WHERE user_id=$1 ORDER BY "createdAt" DESC', [req.user!.id]);
    res.json({ success: true, files: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed to list files' }); }
});

export default router;
