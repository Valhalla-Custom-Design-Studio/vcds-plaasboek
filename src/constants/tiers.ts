// Plaasboek™ Subscription Tiers — Bilingual (AF/EN)
// Gratis (Free) | Pro R199/mo | Onderneming R499/mo

export type PlaasboekTier = 'free' | 'pro' | 'enterprise';

export interface PlaasboekTierDef {
  id: PlaasboekTier;
  name_af: string;
  name_en: string;
  price: number;
  description_af: string;
  description_en: string;
  features_af: string[];
  features_en: string[];
  color: string;
  recommended?: boolean;
}

export const PLAASBOEK_PLANS: Record<PlaasboekTier, PlaasboekTierDef> = {
  free: {
    id: 'free',
    name_af: 'Gratis',
    name_en: 'Free',
    price: 0,
    description_af: 'Basiese plaasbestuur vir kleinboere.',
    description_en: 'Basic farm management for small-scale farmers.',
    features_af: [
      'Basiese plaasrekords',
      'Weer-integrasie',
      'Plaasaanvalwaarskuwings',
      'Gemeenskapsforum',
    ],
    features_en: [
      'Basic farm records',
      'Weather integration',
      'Farm attack alerts',
      'Community forum',
    ],
    color: '#6B7280',
  },
  pro: {
    id: 'pro',
    name_af: 'Pro',
    name_en: 'Pro',
    price: 199,
    description_af: 'Volledige plaasbestuur met AI-analise en finansiële rekords.',
    description_en: 'Full farm management with AI analysis and financial records.',
    features_af: [
      'Alles in Gratis',
      'Gewasopbrengs-voorspellings (AI)',
      'Finansiële rekords & begroting',
      'Kommoditeitspryse (intydse data)',
      'Voertuig- & toerusting-log',
      'Werknemer-bestuur',
      'Satellietbeeldanalise',
      'Prioriteit ondersteuning',
    ],
    features_en: [
      'Everything in Free',
      'Crop yield predictions (AI)',
      'Financial records & budgeting',
      'Commodity prices (live data)',
      'Vehicle & equipment log',
      'Employee management',
      'Satellite imagery analysis',
      'Priority support',
    ],
    color: '#2D5016',
    recommended: true,
  },
  enterprise: {
    id: 'enterprise',
    name_af: 'Onderneming',
    name_en: 'Enterprise',
    price: 499,
    description_af: 'Grootskaalse plaasbestuur vir kommersiële boere.',
    description_en: 'Large-scale farm management for commercial farmers.',
    features_af: [
      'Alles in Pro',
      'Meervoudige plase',
      'AgriScore™ kredietprofiel',
      'Bankintegrasie (Stitch Money)',
      'Uitvoer na boekhouding',
      'Toegewyde rekening-bestuurder',
      'Pasgemaakte verslae',
      'API-toegang',
    ],
    features_en: [
      'Everything in Pro',
      'Multiple farms',
      'AgriScore™ credit profile',
      'Banking integration (Stitch Money)',
      'Export to accounting',
      'Dedicated account manager',
      'Custom reports',
      'API access',
    ],
    color: '#F59E0B',
  },
};
