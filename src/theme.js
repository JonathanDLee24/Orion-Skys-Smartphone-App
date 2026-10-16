import { Platform, useWindowDimensions } from 'react-native';

export const colors = {
  background: '#0B0F19',
  card: '#111620',
  cyan: '#00E5FF',
  gold: '#FFC107',
  text: '#FFFFFF',
  muted: '#73839B',
  error: '#FF3B30',
  border: '#202B3D',
  green: '#00C795',
  cyanTint: '#0B222D',
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
