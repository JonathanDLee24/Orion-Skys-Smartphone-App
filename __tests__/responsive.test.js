import { getResponsiveLayout } from '../src/theme';

describe('responsive layout', () => {
  test.each([
    [320, 'phone', false, 767, 18],
    [390, 'phone', false, 767, 18],
    [767, 'phone', false, 767, 18],
    [768, 'tablet', true, 1100, 32],
    [834, 'tablet', true, 1100, 32],
    [1199, 'tablet', true, 1100, 32],
    [1200, 'desktop', true, 1280, 48],
    [1440, 'desktop', true, 1280, 48],
  ])('%i selects %s mode', (width, mode, wide, maxWidth, padding) => {
    expect(getResponsiveLayout(width)).toMatchObject({ mode, wide, maxWidth, padding });
  });
});
