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

// High-contrast mode keeps the dark identity but pushes every low-contrast
// surface and text token towards the WCAG AAA end of the scale.
export const highContrastColors = {
  card: '#05070A',
  field: '#000000',
  border: '#8A8A8A',
  muted: '#E6E6E6',
  error: '#FF8A80',
  gold: '#FFD54F',
  green: '#4DF0C4',
  cyan: '#7DF3FF',
};

// Dim palette values that readability mode brightens when they are used as
// text or icon colours. Returns null when the colour is already high contrast.
const HIGH_CONTRAST_TEXT_COLORS = {
  '#8C8C8C': '#E6E6E6',
  '#262626': '#A6A6A6',
  '#FF3B30': '#FF8A80',
  '#FFC107': '#FFD54F',
  '#00C795': '#4DF0C4',
  '#00E5FF': '#7DF3FF',
  '#111620': '#000000',
};

export function highContrastTextColor(color) {
  if (typeof color !== 'string') return null;
  return HIGH_CONTRAST_TEXT_COLORS[color.toUpperCase()] || null;
}

export function getResponsiveLayout(width, height = 900) {
  const tablet = width >= 768;
  const desktop = width >= 1200;
  return {
    width,
    height,
    mode: desktop ? 'desktop' : tablet ? 'tablet' : 'phone',
    // Short laptop windows need tighter vertical chrome so a full step still
    // fits without a scrollbar.
    tight: tablet && height < 800,
    wide: tablet,
    padding: desktop ? 48 : tablet ? 32 : 18,
    gap: desktop ? 32 : tablet ? 24 : 14,
    // Fill the viewport at each breakpoint instead of leaving fixed gutters on
    // ordinary laptop screens. The cap only matters on very wide monitors.
    maxWidth: desktop ? 1440 : tablet ? 1200 : 767,
    bodySize: tablet ? 15 : 11,
    labelSize: tablet ? 12 : 10,
  };
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return getResponsiveLayout(width, height);
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const fontSizes = { label: 11, small: 13, body: 15, title: 28, total: 42 };
export const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', web: 'Consolas, monospace', default: 'monospace' });
