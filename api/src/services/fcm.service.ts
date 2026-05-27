import admin from 'firebase-admin';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function sendPushNotification(
  expoPushToken: string | null,
  fcmToken: string | null,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = admin.messaging();
  const token = fcmToken || expoPushToken;
  if (!token) return;

  try {
    await messaging.send({
      token,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high', notification: { sound: 'default', channelId: 'sos_alerts' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err: any) {
    console.error('[FCM] Push failed:', err.message);
  }
}

export async function sendSOSToFamily(
  familyTokens: string[],
  elderName: string,
  sosType: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  await Promise.all(
    familyTokens.map(token =>
      sendPushNotification(
        null, token,
        '🚨 SOS Alert — ' + elderName,
        'Emergency: ' + sosType + (location ? ' — Tap to view location' : ''),
        location ? { lat: String(location.lat), lng: String(location.lng), type: sosType } : { type: sosType }
      )
    )
  );
}
