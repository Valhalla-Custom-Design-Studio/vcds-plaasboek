import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://c517996e4edb4958abf36284cabd1a51@o4511432712650752.ingest.de.sentry.io/4511433550725200',
    environment: process.env.NODE_ENV || 'development',
    release: 'vcds-plaasboek@1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enabled: process.env.NODE_ENV !== 'test',
  });
}

export { Sentry };
