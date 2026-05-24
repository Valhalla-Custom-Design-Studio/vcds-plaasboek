import { api } from './api';
import * as Linking from 'expo-linking';

export const PayFastService = {
  async initiateSubscription(planId: string): Promise<void> {
    const res = await api.post('/payments/initiate', { planId });
    if (res.data.paymentUrl) {
      await Linking.openURL(res.data.paymentUrl);
    } else {
      throw new Error('No payment URL returned');
    }
  },

  async getCurrentSubscription() {
    const res = await api.get('/subscriptions/current');
    return res.data.subscription;
  },

  async getPlans() {
    const res = await api.get('/subscriptions/plans');
    return res.data.plans;
  },
};
