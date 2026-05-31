import { useState, useEffect, useCallback } from 'react';
import { createPayFastSDK, Subscription, TierDefinition } from '../lib/payfast-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  features: string[];
  tierLabel: string;
  tiers: TierDefinition[];
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  isPro: boolean;
  isPlatinum: boolean;
  isElite: boolean;
  refresh: () => Promise<void>;
}

// AppId for this app: plaasboek
export function useSubscription(appId: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [tierLabel, setTierLabel] = useState('Gratis');
  const [tiers, setTiers] = useState<TierDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const sdk = createPayFastSDK(appId);

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('vcds_auth_token');
      if (token) sdk.setToken(token);

      const [subData, tierData] = await Promise.all([
        sdk.getSubscription(),
        sdk.getTiers(),
      ]);

      setSubscription(subData.subscription);
      setFeatures(subData.features);
      setTierLabel(subData.tierLabel);
      setTiers(tierData.tiers);
    } catch (e) {
      console.warn('useSubscription error:', e);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => { load(); }, [load]);

  const hasFeature = useCallback(
    (feature: string) => features.includes(feature),
    [features],
  );

  const tierName = subscription?.tierName || 'free';

  return {
    subscription,
    features,
    tierLabel,
    tiers,
    loading,
    hasFeature,
    isPro: ['pro', 'starter', 'business', 'enterprise', 'elite', 'platinum'].includes(tierName),
    isPlatinum: ['platinum', 'elite', 'enterprise'].includes(tierName),
    isElite: tierName === 'elite',
    refresh: load,
  };
}
