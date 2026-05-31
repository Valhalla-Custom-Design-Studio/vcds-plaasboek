// Plaasboek™ Subscription Tiers
export type PlaasboekTier = 'free' | 'pro' | 'platinum';

export const PLAASBOEK_TIERS = {
  free: {
    id: 'free' as PlaasboekTier,
    name_af: 'Gratis', name_en: 'Free',
    price: 0, color: '#6B7280',
    recommended: false,
    description_af: 'Begin met basiese plaasrekordhouding.',
    description_en: 'Start with basic farm record keeping.',
    features_af: ['Basiese plaasrekords', 'Handmatige invoer', 'Basiese verslae'],
    features_en: ['Basic farm records', 'Manual entry', 'Basic reports'],
    locked_af: ['AgriScore™ AI', 'PatternLearn™', 'Kommoditeitspryse', 'Satellietdata', 'Gevorderde analise'],
    locked_en: ['AgriScore™ AI', 'PatternLearn™', 'Commodity prices', 'Satellite data', 'Advanced analytics'],
  },
  pro: {
    id: 'pro' as PlaasboekTier,
    name_af: 'Pro', name_en: 'Pro',
    price: 129, color: '#16A34A', badge: 'GEWILD',
    recommended: true,
    description_af: 'Bestuur jou plaas slimmer met AI-aangedrewe insigte.',
    description_en: 'Manage your farm smarter with AI-powered insights.',
    features_af: [
      'Alles in Gratis', 'AgriScore™ AI', 'Kommoditeitspryse',
      'Gevorderde verslae', 'Veestapel bestuur', 'Uitgawe-analise',
    ],
    features_en: [
      'Everything in Free', 'AgriScore™ AI', 'Commodity prices',
      'Advanced reports', 'Livestock management', 'Expense analytics',
    ],
    locked_af: ['PatternLearn™ AI', 'Satellietdata', 'Weersintegrasie', 'Prioriteit ondersteuning'],
    locked_en: ['PatternLearn™ AI', 'Satellite data', 'Weather integration', 'Priority support'],
  },
  platinum: {
    id: 'platinum' as PlaasboekTier,
    name_af: 'Platinum', name_en: 'Platinum',
    price: 249, color: '#C9A84C', badge: 'BESTE WAARDE',
    recommended: false,
    description_af: 'Die volledige Plaasboek™ ervaring met PatternLearn™ AI.',
    description_en: 'The full Plaasboek™ experience with PatternLearn™ AI.',
    features_af: [
      'Alles in Pro', 'PatternLearn™ AI', 'Satellietdata (Sentinel Hub)',
      'Weersintegrasie', 'Voorspellende analise', 'Prioriteit ondersteuning',
    ],
    features_en: [
      'Everything in Pro', 'PatternLearn™ AI', 'Satellite data (Sentinel Hub)',
      'Weather integration', 'Predictive analytics', 'Priority support',
    ],
    locked_af: [],
    locked_en: [],
  },
} as const;

// Backward-compat alias — subscription screen uses PLAASBOEK_PLANS
export const PLAASBOEK_PLANS = PLAASBOEK_TIERS;

export const PLAASBOEK_SUBSCRIBE_ROUTE = '/subscription';
export const PLAASBOEK_ACCENT = '#16A34A';
