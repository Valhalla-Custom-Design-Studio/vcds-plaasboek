export type Tier = 'world' | 'sa' | 'platinum';

export interface TierFeatures {
  name: string;
  price: number; // ZAR/month
  features: string[];
  color: string;
}

export const TIERS: Record<Tier, TierFeatures> = {
  world: {
    name: 'World',
    price: 0,
    features: ['Basic access', 'Limited AI queries (10/month)', 'Community support'],
    color: '#6B7280',
  },
  sa: {
    name: 'SA',
    price: 99,
    features: [
      'All World features',
      'AI queries (100/month)',
      'Offline sync',
      'Priority support',
      'Afrikaans + English',
    ],
    color: '#3B82F6',
  },
  platinum: {
    name: 'Platinum',
    price: 299,
    features: [
      'All SA features',
      'Unlimited AI',
      'Advanced analytics',
      'White-glove support',
      'Early access features',
      'No ads',
    ],
    color: '#F59E0B',
  },
};

export function canAccess(userTier: Tier, requiredTier: Tier): boolean {
  const order: Tier[] = ['world', 'sa', 'platinum'];
  return order.indexOf(userTier) >= order.indexOf(requiredTier);
}
