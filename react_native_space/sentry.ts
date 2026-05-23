import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'production',
    release: 'plaasboek@1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enableNative: false, // PWA/Expo Go safe mode
    enableNativeCrashHandling: false,
  });
};

export { Sentry };
