// VCDS PayFast SDK — shared across all Wave 1 apps
// Auto-generated — do not edit manually
// Source of truth: vcds-payfast-manager/src/config/payfast.config.ts

const PAYFAST_API_URL = process.env.EXPO_PUBLIC_PAYFAST_API_URL || 'https://payfast.vcds.co.za';

export interface Subscription {
  id: string;
  userId: string;
  appId: string;
  tierId: string;
  tierName: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  nextBillingDate?: string;
}

export interface TierDefinition {
  id: string;
  price: number;
  label: string;
  features: string[];
}

class VCDSPayFastSDK {
  private token: string | null = null;
  private appId: string;

  constructor(appId: string) {
    this.appId = appId;
  }

  setToken(token: string) {
    this.token = token;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  // Get current user subscription
  async getSubscription(): Promise<{ subscription: Subscription; features: string[]; tierLabel: string }> {
    const res = await fetch(`${PAYFAST_API_URL}/subscriptions/${this.appId}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error('Failed to fetch subscription');
    return res.json();
  }

  // Get all tiers for this app
  async getTiers(): Promise<{ appId: string; tiers: TierDefinition[] }> {
    const res = await fetch(`${PAYFAST_API_URL}/subscriptions/${this.appId}/tiers`);
    if (!res.ok) throw new Error('Failed to fetch tiers');
    return res.json();
  }

  // Check if user has a specific feature
  async hasFeature(feature: string): Promise<boolean> {
    const res = await fetch(`${PAYFAST_API_URL}/subscriptions/${this.appId}/check/${feature}`, {
      headers: this.headers,
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.allowed === true;
  }

  // Initiate a PayFast payment — returns form URL + fields to POST
  async initiatePayment(params: {
    tierId: string;
    userEmail: string;
    userName: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; fields: Record<string, string> }> {
    const res = await fetch(`${PAYFAST_API_URL}/payfast/initiate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ appId: this.appId, ...params }),
    });
    if (!res.ok) throw new Error('Failed to initiate payment');
    return res.json();
  }

  // Cancel subscription
  async cancelSubscription(): Promise<void> {
    await fetch(`${PAYFAST_API_URL}/subscriptions/${this.appId}`, {
      method: 'DELETE',
      headers: this.headers,
    });
  }
}

export const createPayFastSDK = (appId: string) => new VCDSPayFastSDK(appId);
