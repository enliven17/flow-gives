import config from './tailwind.config';

describe('Tailwind Configuration - Dark Theme', () => {
  describe('Color Palette', () => {
    it('should define background colors', () => {
      expect(config.theme?.extend?.colors).toHaveProperty('background');
      const background = (config.theme?.extend?.colors as any).background;
      
      expect(background).toHaveProperty('primary', '#0a0a0a');
      expect(background).toHaveProperty('secondary', '#141414');
      expect(background).toHaveProperty('tertiary', '#1e1e1e');
    });

    it('should define text colors', () => {
      expect(config.theme?.extend?.colors).toHaveProperty('text');
      const text = (config.theme?.extend?.colors as any).text;
      
      expect(text).toHaveProperty('primary', '#ffffff');
      expect(text).toHaveProperty('secondary', '#a3a3a3');
      expect(text).toHaveProperty('muted', '#737373');
    });

    it('should define accent colors', () => {
      expect(config.theme?.extend?.colors).toHaveProperty('accent');
      const accent = (config.theme?.extend?.colors as any).accent;
      
      expect(accent).toHaveProperty('primary', '#10b981');
      expect(accent).toHaveProperty('secondary', '#059669');
      expect(accent).toHaveProperty('success', '#10b981');
      expect(accent).toHaveProperty('warning', '#10b981');
      expect(accent).toHaveProperty('error', '#ef4444');
    });

    it('should define border colors', () => {
      expect(config.theme?.extend?.colors).toHaveProperty('border');
      const border = (config.theme?.extend?.colors as any).border;
      
      expect(border).toHaveProperty('default', '#262626');
      expect(border).toHaveProperty('hover', '#404040');
    });
  });

  describe('Border Radius', () => {
    it('should define border radius tokens', () => {
      expect(config.theme?.extend?.borderRadius).toBeDefined();
      const borderRadius = config.theme?.extend?.borderRadius as any;
      
      expect(borderRadius).toHaveProperty('sm', '0.375rem');
      expect(borderRadius).toHaveProperty('md', '0.5rem');
      expect(borderRadius).toHaveProperty('lg', '0.75rem');
      expect(borderRadius).toHaveProperty('xl', '1rem');
    });
  });

  describe('Box Shadows', () => {
    it('should define shadow tokens', () => {
      expect(config.theme?.extend?.boxShadow).toBeDefined();
      const boxShadow = config.theme?.extend?.boxShadow as any;
      
      expect(boxShadow).toHaveProperty('sm', '0 1px 2px 0 rgba(0, 0, 0, 0.5)');
      expect(boxShadow).toHaveProperty('md', '0 4px 6px -1px rgba(0, 0, 0, 0.5)');
      expect(boxShadow).toHaveProperty('lg', '0 10px 15px -3px rgba(0, 0, 0, 0.5)');
      expect(boxShadow).toHaveProperty('xl', '0 20px 25px -5px rgba(0, 0, 0, 0.5)');
    });
  });

  describe('Spacing', () => {
    it('should define custom spacing tokens', () => {
      expect(config.theme?.extend?.spacing).toBeDefined();
      const spacing = config.theme?.extend?.spacing as any;
      
      expect(spacing).toHaveProperty('18', '4.5rem');
      expect(spacing).toHaveProperty('22', '5.5rem');
      expect(spacing).toHaveProperty('26', '6.5rem');
      expect(spacing).toHaveProperty('30', '7.5rem');
    });
  });

  describe('Content Paths', () => {
    it('should include all necessary content paths', () => {
      expect(config.content).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}');
      expect(config.content).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}');
      expect(config.content).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');
      expect(config.content).toContain('./lib/**/*.{js,ts,jsx,tsx,mdx}');
    });
  });

  describe('Color Format Validation', () => {
    it('should use valid hex color format for all colors', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      const colors = config.theme?.extend?.colors as any;
      
      // Test background colors
      expect(colors.background.primary).toMatch(hexColorRegex);
      expect(colors.background.secondary).toMatch(hexColorRegex);
      expect(colors.background.tertiary).toMatch(hexColorRegex);
      
      // Test text colors
      expect(colors.text.primary).toMatch(hexColorRegex);
      expect(colors.text.secondary).toMatch(hexColorRegex);
      expect(colors.text.muted).toMatch(hexColorRegex);
      
      // Test accent colors
      expect(colors.accent.primary).toMatch(hexColorRegex);
      expect(colors.accent.secondary).toMatch(hexColorRegex);
      expect(colors.accent.success).toMatch(hexColorRegex);
      expect(colors.accent.warning).toMatch(hexColorRegex);
      expect(colors.accent.error).toMatch(hexColorRegex);
      
      // Test border colors
      expect(colors.border.default).toMatch(hexColorRegex);
      expect(colors.border.hover).toMatch(hexColorRegex);
    });
  });

  describe('Dark Theme Characteristics', () => {
    it('should have dark background colors (low luminance)', () => {
      const colors = config.theme?.extend?.colors as any;
      
      // Convert hex to RGB and check luminance
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      
      const getLuminance = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        
        // Relative luminance formula
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      
      // Background colors should have low luminance (dark)
      expect(getLuminance(colors.background.primary)).toBeLessThan(0.1);
      expect(getLuminance(colors.background.secondary)).toBeLessThan(0.1);
      expect(getLuminance(colors.background.tertiary)).toBeLessThan(0.1);
    });

    it('should have light text colors (high luminance)', () => {
      const colors = config.theme?.extend?.colors as any;
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      
      const getLuminance = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      
      // Primary text should have high luminance (light)
      expect(getLuminance(colors.text.primary)).toBeGreaterThan(0.8);
    });
  });
});
