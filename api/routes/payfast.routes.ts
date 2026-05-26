import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

router.post('/payfast/webhook', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Validate PayFast signature
    const received = data.signature;
    delete data.signature;
    const str = Object.keys(data)
      .sort()
      .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&');
    const expected = crypto.createHash('md5').update(str).digest('hex');
    if (received !== expected) {
      return res.status(400).send('Invalid signature');
    }
    // Update subscription on payment_status=COMPLETE
    if (data.payment_status === 'COMPLETE') {
      const { m_payment_id, custom_str1: userId, custom_str2: tier } = data;
      // TODO: update user tier in DB
      console.log(`Payment complete: user=${userId} tier=${tier} ref=${m_payment_id}`);
    }
    return res.status(200).send('OK');
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
