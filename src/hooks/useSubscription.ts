/**
 * VCDS™ Unified Subscription Hook
 * Shared across all Wave 1 apps — DO NOT modify per-app
 * Tier hierarchy: free → pro → platinum
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VCDSTier = 'free' | 'pro' | 'platinum';

const CACHE_KEY = 'vcds_sub_v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

interface SubCache {
  tier: VCDSTier;
  expiresAt: string | null;
  cachedAt: number;
}

export function useSubscription(apiBase: string, token: string | null) {
  const [tier, setTier] = useState<VCDSTier>('free');
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const p: SubCache = JSON.parse(cached);
        if (Date.now() - p.cachedAt < CACHE_TTL) {
          setTier(p.tier); setExpiresAt(p.expiresAt); setLoading(false); return;
        }
      }
      const res = await fetch(`${apiBase}/api/subscriptions/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        const cache: SubCache = { tier: d.tier || 'free', expiresAt: d.expiresAt || null, cachedAt: Date.now() };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        setTier(cache.tier); setExpiresAt(cache.expiresAt);
      }
    } catch { /* silent — default to free */ }
    finally { setLoading(false); }
  }, [token, apiBase]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    tier,
    loading,
    expiresAt,
    refresh,
    isFree: tier === 'free',
    isPro: tier === 'pro' || tier === 'platinum',
    isPlatinum: tier === 'platinum',
    can: (required: VCDSTier) => {
      const rank: Record<VCDSTier, number> = { free: 0, pro: 1, platinum: 2 };
      return rank[tier] >= rank[required];
    },
  };
}
