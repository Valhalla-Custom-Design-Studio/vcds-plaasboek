import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

export async function sendPushNotification(messages: PushMessage | PushMessage[]): Promise<void> {
  const payload = Array.isArray(messages) ? messages : [messages];
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < payload.length; i += 100) chunks.push(payload.slice(i, i + 100));

  for (const chunk of chunks) {
    try {
      const res = await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN ? { 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        timeout: 10000,
      });
      const tickets = res.data?.data || [];
      tickets.forEach((ticket: any, i: number) => {
        if (ticket.status === 'error') {
          console.error(`Push error for token ${i}:`, ticket.message, ticket.details);
        }
      });
    } catch (err: any) {
      console.error('Expo push send error:', err?.response?.data || err.message);
    }
  }
}

export async function sendPushToUsers(userIds: string[], pool: any, title: string, body: string, data?: Record<string, any>): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT token FROM push_tokens WHERE user_id = ANY($1)',
      [userIds]
    );
    const tokens: string[] = result.rows.map((r: any) => r.token).filter(Boolean);
    if (!tokens.length) return;
    await sendPushNotification(tokens.map(to => ({ to, title, body, data, sound: 'default', priority: 'high' })));
  } catch (err) {
    console.error('sendPushToUsers error:', err);
  }
}
