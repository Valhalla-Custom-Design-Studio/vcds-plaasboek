import axios from 'axios';

const BULKSMS_URL = 'https://api.bulksms.com/v1/messages';

export async function sendSMS(to: string | string[], body: string): Promise<boolean> {
  const tokenId = process.env.BULKSMS_TOKEN_ID;
  const tokenSecret = process.env.BULKSMS_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.warn('BulkSMS credentials not configured — SMS skipped');
    return false;
  }

  const recipients = Array.isArray(to) ? to : [to];
  const messages = recipients.map(number => ({
    to: number.startsWith('+') ? number : `+27${number.replace(/^0/, '')}`,
    body,
  }));

  try {
    const res = await axios.post(BULKSMS_URL, messages, {
      auth: { username: tokenId, password: tokenSecret },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log(`SMS sent to ${recipients.length} recipient(s):`, res.status);
    return true;
  } catch (err: any) {
    console.error('BulkSMS error:', err?.response?.data || err.message);
    return false;
  }
}

export async function sendSOSSms(contacts: { phone: string; name: string }[], farmerName: string, lat?: number, lng?: number): Promise<void> {
  const locationStr = lat && lng ? `\nLigging: https://maps.google.com/?q=${lat},${lng}` : '';
  const body = `🚨 NOODGEVAL - ${farmerName} het 'n SOS gestuur!${locationStr}\nBel onmiddellik of gaan kyk. - Plaasboek™`;
  await Promise.all(contacts.map(c => sendSMS(c.phone, body)));
}
