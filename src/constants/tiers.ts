// Plaasboek™ Subscription Tiers
export type PlaasboekTier = 'free' | 'pro' | 'platinum';

export const PLAASBOEK_TIERS = {
  free: {
    id: 'free', name_af: 'Gratis', name_en: 'Free', price: 0,
    color: '#6B7280',
    features_af: ['Basiese plaasrekords', 'Handmatige invoer', 'Basiese verslae'],
    locked_af: ['AgriScore™ AI', 'PatternLearn™', 'Kommoditeitspryse', 'Satellietdata', 'Gevorderde analise'],
  },
  pro: {
    id: 'pro', name_af: 'Pro', name_en: 'Pro', price: 129,
    color: '#16A34A', badge: 'GEWILD',
    features_af: [
      'Alles in Gratis', 'AgriScore™ AI', 'Kommoditeitspryse',
      'Gevorderde verslae', 'Veestapel bestuur', 'Uitgawe-analise',
    ],
    locked_af: ['PatternLearn™ AI', 'Satellietdata', 'Weersintegrasie', 'Prioriteit ondersteuning'],
  },
  platinum: {
    id: 'platinum', name_af: 'Platinum', name_en: 'Platinum', price: 249,
    color: '#C9A84C', badge: 'BESTE WAARDE',
    features_af: [
      'Alles in Pro', 'PatternLearn™ AI', 'Satellietdata (Sentinel Hub)',
      'Weersintegrasie', 'Voorspellende analise', 'Prioriteit ondersteuning',
    ],
    locked_af: [],
  },
} as const;

export const PLAASBOEK_SUBSCRIBE_ROUTE = '/subscription';
export const PLAASBOEK_ACCENT = '#16A34A';
