import PostHog from 'posthog-react-native';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY || 'phc_w8M2RMQe86ghfbEgYUu4TWhgxZyL9EHDvPVLJBUcoxHC',
  {
    host: 'https://eu.i.posthog.com',
    disabled: process.env.NODE_ENV === 'test',
  }
);

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  try {
    posthog.capture(event, properties);
  } catch (e) {
    // Non-blocking
  }
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  try {
    posthog.identify(userId, traits);
  } catch (e) {
    // Non-blocking
  }
};

export const resetUser = () => {
  try {
    posthog.reset();
  } catch (e) {
    // Non-blocking
  }
};
