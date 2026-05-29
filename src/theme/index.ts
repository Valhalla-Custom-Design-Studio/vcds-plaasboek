export const Colors = {
  // Backgrounds
  background: '#0C1A0F',
  surface: '#132218',
  surfaceElevated: '#1A2E1F',
  surfaceBorder: '#2A3F2F',
  tabBar: '#0F1F13',

  // Brand
  primary: '#15803D',
  primaryLight: '#22C55E',
  primaryDark: '#166534',

  // Text
  textPrimary: '#F0FDF4',
  textSecondary: '#86EFAC',
  textMuted: '#4ADE80',
  textDisabled: '#374151',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // SOS types
  attack: '#DC2626',
  medical: '#2563EB',
  fire: '#EA580C',
  general: '#7C3AED',

  // Expense categories
  fuel: '#F97316',
  feed: '#84CC16',
  vet: '#06B6D4',
  fencing: '#8B5CF6',
  labour: '#EC4899',
  equipment: '#F59E0B',
  other: '#6B7280',

  // SOS color aliases
  medical: '#2563EB', // alias for info

  // Aliases
  text: '#F0FDF4', // alias for textPrimary
  border: '#2A3F2F', // alias for surfaceBorder

  // Misc
  gold: '#F59E0B',
  overlay: 'rgba(0,0,0,0.6)',
  inputBg: '#1A2E1F',
  inputBorder: '#2A3F2F',
  inputFocus: '#15803D',
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
};

// ─── Platinum Design System Additions ───────────────────────
export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  }),
  glowRed: { shadowColor: '#FF1744', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16, elevation: 10 },
};

export const PlatinumTokens = {
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.10)',
  surfaceElevated: 'rgba(255,255,255,0.08)',
  accentGreen: '#22C55E',
  accentRed: '#EF4444',
  accentPurple: '#A855F7',
  accentViolet: '#8B5CF6',
  accentYellow: '#EAB308',
  accentBlue: '#3B82F6',
  accentOrange: '#F97316',
};
