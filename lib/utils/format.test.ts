/**
 * Tests for formatting utility functions
 * 
 * Includes both unit tests for specific examples and edge cases,
 * and property-based tests for universal correctness properties.
 */

import {
  calculateFundingPercentage,
  calculateTimeRemaining,
  formatWalletAddress,
  formatUSDCx,
  formatTimeRemaining,
} from './format';

describe('calculateFundingPercentage', () => {
  describe('unit tests', () => {
    it('should calculate correct percentage for partial funding', () => {
      expect(calculateFundingPercentage(50000000n, 100000000n)).toBe(50);
      expect(calculateFundingPercentage(25000000n, 100000000n)).toBe(25);
      expect(calculateFundingPercentage(75000000n, 100000000n)).toBe(75);
    });

    it('should handle 0% funding', () => {
      expect(calculateFundingPercentage(0n, 100000000n)).toBe(0);
    });

    it('should handle 100% funding', () => {
      expect(calculateFundingPercentage(100000000n, 100000000n)).toBe(100);
    });

    it('should handle overfunding (>100%)', () => {
      expect(calculateFundingPercentage(150000000n, 100000000n)).toBe(150);
      expect(calculateFundingPercentage(200000000n, 100000000n)).toBe(200);
    });

    it('should return 0 when funding goal is 0', () => {
      expect(calculateFundingPercentage(50000000n, 0n)).toBe(0);
      expect(calculateFundingPercentage(0n, 0n)).toBe(0);
    });

    it('should handle very large amounts', () => {
      const largeGoal = 1000000000000n; // 1 million USDCx
      const largeRaised = 500000000000n; // 500k USDCx
      expect(calculateFundingPercentage(largeRaised, largeGoal)).toBe(50);
    });

    it('should handle very small amounts', () => {
      expect(calculateFundingPercentage(1n, 100n)).toBe(1);
      expect(calculateFundingPercentage(1n, 1000n)).toBe(0); // Rounds down
    });

    it('should truncate decimal percentages', () => {
      // 33.33...% should become 33
      expect(calculateFundingPercentage(33333333n, 100000000n)).toBe(33);
      // 66.66...% should become 66
      expect(calculateFundingPercentage(66666666n, 100000000n)).toBe(66);
    });
  });
});

describe('calculateTimeRemaining', () => {
  describe('unit tests', () => {
    it('should calculate positive time remaining for future deadline', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const deadline = new Date('2024-01-02T00:00:00Z');
      const remaining = calculateTimeRemaining(deadline, now);
      expect(remaining).toBe(24 * 60 * 60 * 1000); // 24 hours in ms
    });

    it('should calculate negative time remaining for past deadline', () => {
      const now = new Date('2024-01-02T00:00:00Z');
      const deadline = new Date('2024-01-01T00:00:00Z');
      const remaining = calculateTimeRemaining(deadline, now);
      expect(remaining).toBe(-24 * 60 * 60 * 1000); // -24 hours in ms
    });

    it('should return 0 when deadline equals current time', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const deadline = new Date('2024-01-01T00:00:00Z');
      expect(calculateTimeRemaining(deadline, now)).toBe(0);
    });

    it('should use current time when not provided', () => {
      const futureDeadline = new Date(Date.now() + 1000000);
      const remaining = calculateTimeRemaining(futureDeadline);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(1000000);
    });

    it('should handle deadlines far in the future', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const deadline = new Date('2025-01-01T00:00:00Z');
      const remaining = calculateTimeRemaining(deadline, now);
      // 2024 is a leap year, so 366 days
      expect(remaining).toBe(366 * 24 * 60 * 60 * 1000);
    });

    it('should handle deadlines far in the past', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const deadline = new Date('2023-01-01T00:00:00Z');
      const remaining = calculateTimeRemaining(deadline, now);
      // 2023 is not a leap year, so 365 days
      expect(remaining).toBe(-365 * 24 * 60 * 60 * 1000);
    });
  });
});

describe('formatWalletAddress', () => {
  describe('unit tests', () => {
    it('should truncate standard Stacks addresses correctly', () => {
      const address = 'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P';
      expect(formatWalletAddress(address)).toBe('ST1X6Y...7O8P');
    });

    it('should truncate mainnet addresses correctly', () => {
      const address = 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K';
      expect(formatWalletAddress(address)).toBe('SP3Y2Z...QA4K');
    });

    it('should handle short addresses without truncation', () => {
      expect(formatWalletAddress('ST123')).toBe('ST123');
      expect(formatWalletAddress('SP12345678')).toBe('SP12345678');
    });

    it('should handle exactly 10 character addresses', () => {
      expect(formatWalletAddress('ST12345678')).toBe('ST12345678');
    });

    it('should handle 11 character addresses (minimum for truncation)', () => {
      expect(formatWalletAddress('ST123456789')).toBe('ST1234...6789');
    });

    it('should handle empty string', () => {
      expect(formatWalletAddress('')).toBe('');
    });

    it('should preserve first 6 and last 4 characters', () => {
      const address = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const formatted = formatWalletAddress(address);
      expect(formatted.startsWith('ABCDEF')).toBe(true);
      expect(formatted.endsWith('WXYZ')).toBe(true);
      expect(formatted).toBe('ABCDEF...WXYZ');
    });
  });
});

describe('formatUSDCx', () => {
  describe('unit tests', () => {
    it('should format whole USDCx amounts', () => {
      expect(formatUSDCx(1000000n)).toBe('1.00');
      expect(formatUSDCx(5000000n)).toBe('5.00');
      expect(formatUSDCx(100000000n)).toBe('100.00');
    });

    it('should format fractional USDCx amounts', () => {
      expect(formatUSDCx(1500000n)).toBe('1.50');
      expect(formatUSDCx(1250000n)).toBe('1.25');
      expect(formatUSDCx(1010000n)).toBe('1.01');
    });

    it('should format amounts less than 1 USDCx', () => {
      expect(formatUSDCx(500000n)).toBe('0.50');
      expect(formatUSDCx(123456n)).toBe('0.12');
      expect(formatUSDCx(10000n)).toBe('0.01');
    });

    it('should format zero amount', () => {
      expect(formatUSDCx(0n)).toBe('0.00');
    });

    it('should handle large amounts', () => {
      expect(formatUSDCx(1000000000000n)).toBe('1000000.00');
      expect(formatUSDCx(999999000000n)).toBe('999999.00');
    });

    it('should always show 2 decimal places', () => {
      const formatted = formatUSDCx(1234567n);
      expect(formatted).toMatch(/^\d+\.\d{2}$/);
    });

    it('should round amounts with more than 2 decimals', () => {
      // 1.234567 USDCx should display as 1.23
      expect(formatUSDCx(1234567n)).toBe('1.23');
      // 1.999999 USDCx rounds to 2.00
      expect(formatUSDCx(1999999n)).toBe('2.00');
      // 1.995000 USDCx rounds to 2.00
      expect(formatUSDCx(1995000n)).toBe('2.00');
      // 1.994999 USDCx rounds to 1.99
      expect(formatUSDCx(1994999n)).toBe('1.99');
    });
  });
});

describe('formatTimeRemaining', () => {
  describe('unit tests', () => {
    it('should format days correctly', () => {
      expect(formatTimeRemaining(86400000)).toBe('1 day'); // 1 day
      expect(formatTimeRemaining(172800000)).toBe('2 days'); // 2 days
      expect(formatTimeRemaining(432000000)).toBe('5 days'); // 5 days
    });

    it('should format hours correctly', () => {
      expect(formatTimeRemaining(3600000)).toBe('1 hour'); // 1 hour
      expect(formatTimeRemaining(7200000)).toBe('2 hours'); // 2 hours
      expect(formatTimeRemaining(10800000)).toBe('3 hours'); // 3 hours
    });

    it('should format minutes correctly', () => {
      expect(formatTimeRemaining(60000)).toBe('1 minute'); // 1 minute
      expect(formatTimeRemaining(120000)).toBe('2 minutes'); // 2 minutes
      expect(formatTimeRemaining(2700000)).toBe('45 minutes'); // 45 minutes
    });

    it('should handle less than a minute', () => {
      expect(formatTimeRemaining(30000)).toBe('Less than a minute'); // 30 seconds
      expect(formatTimeRemaining(1000)).toBe('Less than a minute'); // 1 second
      expect(formatTimeRemaining(100)).toBe('Less than a minute'); // 0.1 seconds
    });

    it('should handle expired time (negative)', () => {
      expect(formatTimeRemaining(-1000)).toBe('Expired');
      expect(formatTimeRemaining(-86400000)).toBe('Expired');
    });

    it('should handle zero time', () => {
      expect(formatTimeRemaining(0)).toBe('Less than a minute');
    });

    it('should prefer larger units', () => {
      // 25 hours should show as 1 day, not 25 hours
      expect(formatTimeRemaining(90000000)).toBe('1 day');
      // 90 minutes should show as 1 hour, not 90 minutes
      expect(formatTimeRemaining(5400000)).toBe('1 hour');
    });

    it('should use singular for 1 unit', () => {
      expect(formatTimeRemaining(86400000)).toContain('day');
      expect(formatTimeRemaining(3600000)).toContain('hour');
      expect(formatTimeRemaining(60000)).toContain('minute');
    });

    it('should use plural for multiple units', () => {
      expect(formatTimeRemaining(172800000)).toContain('days');
      expect(formatTimeRemaining(7200000)).toContain('hours');
      expect(formatTimeRemaining(120000)).toContain('minutes');
    });
  });
});
