import axios from 'axios';

const TOKEN_ID = process.env.BULKSMS_TOKEN_ID || '';
const TOKEN_SECRET = process.env.BULKSMS_TOKEN_SECRET || '';

export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!TOKEN_ID || !TOKEN_SECRET) { console.warn('[BulkSMS] No credentials — SMS skipped'); return false; }
  try {
    await axios.post('https://api.bulksms.com/v1/messages', { to, body }, {
      auth: { username: TOKEN_ID, password: TOKEN_SECRET },
      timeout: 10000,
    });
    return true;
  } catch (err: any) {
    console.error('[BulkSMS] Failed:', err.response?.data || err.message);
    return false;
  }
}

export async function sendBulkSms(recipients: string[], body: string): Promise<number> {
  let count = 0;
  await Promise.all(recipients.map(async (phone) => {
    const ok = await sendSms(phone, body);
    if (ok) count++;
  }));
  return count;
}
