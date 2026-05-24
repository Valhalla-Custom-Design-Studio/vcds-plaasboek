import axios from 'axios';

export async function sendPushNotifications(tokens: string[], title: string, body: string, data?: any): Promise<number> {
  if (!tokens.length) return 0;
  const messages = tokens.map(to => ({ to, title, body, data: data||{}, sound: 'default', priority: 'high' }));
  try {
    const res = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      timeout: 15000,
    });
    const tickets = Array.isArray(res.data.data) ? res.data.data : [];
    return tickets.filter((t: any) => t.status === 'ok').length;
  } catch (err: any) {
    console.error('[ExpoPush] Failed:', err.message);
    return 0;
  }
}
