export const Colors = {
  primary: '#15803D',
  primaryDark: '#166534',
  accent: '#92400E',
  accentDark: '#78350F',
  error: '#DC2626',
  warning: '#D97706',
  success: '#15803D',
  background: '#0C1A0F',
  surface: 'rgba(21, 128, 61, 0.08)',
  surfaceBorder: 'rgba(21, 128, 61, 0.15)',
  textPrimary: '#E8F0E8',
  textSecondary: '#9CA38A',
  textMuted: '#687260',
  tabBar: 'rgba(12, 26, 15, 0.95)',
  inputBg: 'rgba(21, 128, 61, 0.06)',
  inputBorder: 'rgba(21, 128, 61, 0.2)',
  // SOS types
  attack: '#DC2626',
  medical: '#3B82F6',
  fire: '#F97316',
  general: '#EAB308',
  // Expense categories
  fuel: '#EF4444', feed: '#F59E0B', vet: '#3B82F6', fencing: '#8B5CF6',
  labour: '#10B981', equipment: '#EC4899', other: '#687280',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: 'bold' as const, fontFamily: 'Georgia' },
  h2: { fontSize: 24, fontWeight: '600' as const, fontFamily: 'Georgia' },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
};

export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
