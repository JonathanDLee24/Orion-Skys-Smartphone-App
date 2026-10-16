import { Platform, useWindowDimensions } from 'react-native';

export const colors = {
  background: '#000000',
  card: '#111620',
  cyan: '#00E5FF',
  field: '#0A0A0A',
  accent: '#DAFF02',
  accentTint: '#1A2200',
  gold: '#FFC107',
  text: '#FFFFFF',
  muted: '#8C8C8C',
  error: '#FF3B30',
  border: '#262626',
  green: '#00C795',
};

export function getResponsiveLayout(width) {
  const tablet = width >= 768;
  const desktop = width >= 1200;
  return {
    mode: desktop ? 'desktop' : tablet ? 'tablet' : 'phone',
    wide: tablet,
    padding: desktop ? 48 : tablet ? 32 : 18,
    gap: desktop ? 32 : tablet ? 24 : 14,
    maxWidth: desktop ? 1280 : tablet ? 1100 : 767,
    bodySize: tablet ? 15 : 11,
    labelSize: tablet ? 12 : 10,
  };
}

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  return getResponsiveLayout(width);
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const fontSizes = { label: 11, small: 13, body: 15, title: 28, total: 42 };
export const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', web: 'Consolas, monospace', default: 'monospace' });
