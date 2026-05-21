import { useState } from 'react';
import api from '../services/api';

export interface PayfastTier {
  tier: string;
  amount_cents: number;
  amount_zar: string;
  currency: string;
}

export function usePayfast() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    tier: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/payments/initiate', params);
      // data.redirectUrl + data.payload — open in WebView or browser
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment initiation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTiers = async (): Promise<PayfastTier[]> => {
    const { data } = await api.get('/payments/tiers');
    return data.tiers;
  };

  return { initiatePayment, getTiers, loading, error };
}
