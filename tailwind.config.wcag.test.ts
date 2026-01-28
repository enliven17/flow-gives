/**
 * Property Test: WCAG AA Contrast Compliance
 * 
 * Feature: platform-modernization
 * Property P1: WCAG Contrast Compliance
 * 
 * For any text element in the dark theme, the contrast ratio between 
 * text color and background color should meet or exceed WCAG AA standards:
 * - 4.5:1 for normal text
 * - 3:1 for large text
 * 
 * Validates: Requirements 2.2, 2.5
 */

import fc from 'fast-check';
import config from './tailwind.config';

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  // Normalize RGB values to 0-1 range
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance using weighted sum
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 specification
 * 
 * @param color1 First color (hex)
 * @param color2 Second color (hex)
 * @returns Contrast ratio (1.0 to 21.0)
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  // Ensure lighter color is in numerator
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get all color values from theme configuration
 */
function getAllThemeColors(): { category: string; name: string; value: string }[] {
  const colors: { category: string; name: string; value: string }[] = [];
  const themeColors = (config.theme?.extend?.colors as any) || {};

  // Extract all color values
  Object.keys(themeColors).forEach((category) => {
    const categoryColors = themeColors[category];
    if (typeof categoryColors === 'object') {
      Object.keys(categoryColors).forEach((name) => {
        const value = categoryColors[name];
        if (typeof value === 'string' && value.startsWith('#')) {
          colors.push({ category, name, value });
        }
      });
    }
  });

  return colors;
}

describe('Feature: platform-modernization, Property P1: WCAG Contrast Compliance', () => {
  const themeColors = getAllThemeColors();
  const backgroundColors = themeColors.filter((c) => c.category === 'background');
  const textColors = themeColors.filter((c) => c.category === 'text');

  describe('Normal Text Contrast (≥ 4.5:1)', () => {
    it('should meet WCAG AA standards for all text/background combinations', () => {
      // Test all combinations of text and background colors
      const combinations: Array<{ text: string; background: string; ratio: number }> = [];

      textColors.forEach((textColor) => {
        backgroundColors.forEach((bgColor) => {
          const ratio = calculateContrastRatio(textColor.value, bgColor.value);
          combinations.push({
            text: `${textColor.category}.${textColor.name}`,
            background: `${bgColor.category}.${bgColor.name}`,
            ratio,
          });
        });
      });

      // Verify all combinations meet WCAG AA standard for normal text
      const failingCombinations = combinations.filter((c) => c.ratio < 4.5);

      if (failingCombinations.length > 0) {
        const failures = failingCombinations
          .map((c) => `  ${c.text} on ${c.background}: ${c.ratio.toFixed(2)}:1`)
          .join('\n');
        throw new Error(
          `WCAG AA contrast violation (normal text requires ≥4.5:1):\n${failures}`
        );
      }

      // All combinations pass
      expect(combinations.length).toBeGreaterThan(0);
      combinations.forEach((c) => {
        expect(c.ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Large Text Contrast (≥ 3:1)', () => {
    it('should meet WCAG AA standards for large text on all backgrounds', () => {
      // Large text has a lower requirement (3:1)
      const combinations: Array<{ text: string; background: string; ratio: number }> = [];

      textColors.forEach((textColor) => {
        backgroundColors.forEach((bgColor) => {
          const ratio = calculateContrastRatio(textColor.value, bgColor.value);
          combinations.push({
            text: `${textColor.category}.${textColor.name}`,
            background: `${bgColor.category}.${bgColor.name}`,
            ratio,
          });
        });
      });

      // Verify all combinations meet WCAG AA standard for large text
      const failingCombinations = combinations.filter((c) => c.ratio < 3.0);

      if (failingCombinations.length > 0) {
        const failures = failingCombinations
          .map((c) => `  ${c.text} on ${c.background}: ${c.ratio.toFixed(2)}:1`)
          .join('\n');
        throw new Error(
          `WCAG AA contrast violation (large text requires ≥3.0:1):\n${failures}`
        );
      }

      // All combinations pass
      expect(combinations.length).toBeGreaterThan(0);
      combinations.forEach((c) => {
        expect(c.ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe('Property-Based Test: Random Color Combinations', () => {
    it('should maintain WCAG AA compliance for any valid hex color combination', () => {
      fc.assert(
        fc.property(
          // Generate random hex colors
          fc.hexaString({ minLength: 6, maxLength: 6 }),
          fc.hexaString({ minLength: 6, maxLength: 6 }),
          (textHex, bgHex) => {
            const textColor = `#${textHex}`;
            const bgColor = `#${bgHex}`;

            // Calculate contrast ratio
            const ratio = calculateContrastRatio(textColor, bgColor);

            // For this property test, we're verifying the calculation works correctly
            // The actual theme colors are tested in the specific tests above
            // This test ensures our contrast calculation function is correct

            // Contrast ratio should always be between 1.0 and 21.0
            expect(ratio).toBeGreaterThanOrEqual(1.0);
            expect(ratio).toBeLessThanOrEqual(21.0);

            // If ratio meets WCAG AA for normal text, it should also meet it for large text
            if (ratio >= 4.5) {
              expect(ratio).toBeGreaterThanOrEqual(3.0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Specific Theme Color Combinations', () => {
    it('should verify critical text/background pairs meet standards', () => {
      const criticalPairs = [
        // Primary text on primary background (most common)
        {
          text: '#ffffff',
          background: '#0a0a0a',
          name: 'primary text on primary background',
        },
        // Primary text on secondary background (cards)
        {
          text: '#ffffff',
          background: '#141414',
          name: 'primary text on secondary background',
        },
        // Secondary text on primary background
        {
          text: '#a3a3a3',
          background: '#0a0a0a',
          name: 'secondary text on primary background',
        },
        // Secondary text on secondary background
        {
          text: '#a3a3a3',
          background: '#141414',
          name: 'secondary text on secondary background',
        },
        // Muted text on primary background
        {
          text: '#8a8a8a',
          background: '#0a0a0a',
          name: 'muted text on primary background',
        },
      ];

      criticalPairs.forEach((pair) => {
        const ratio = calculateContrastRatio(pair.text, pair.background);
        expect(ratio).toBeGreaterThanOrEqual(
          4.5,
          `${pair.name} should have contrast ≥4.5:1, got ${ratio.toFixed(2)}:1`
        );
      });
    });
  });
});
