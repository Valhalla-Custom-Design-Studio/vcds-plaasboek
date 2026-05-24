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
