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
  formatFlow,
  formatTimeRemaining,
  toMicroFlow,
  fromMicroFlow,
  isValidFlowAddress,
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
      const largeGoal = 1000000000000n; // 10,000 Flow
      const largeRaised = 500000000000n; // 5,000 Flow
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
    it('should truncate standard Flow addresses correctly', () => {
      const address = '0x1234567890abcdef';
      expect(formatWalletAddress(address)).toBe('0x1234...cdef');
    });

    it('should truncate longer Flow addresses correctly', () => {
      const address = '0xabcdef1234567890';
      expect(formatWalletAddress(address)).toBe('0xabcd...7890');
    });

    it('should handle short addresses without truncation', () => {
      expect(formatWalletAddress('0x123')).toBe('0x123');
      expect(formatWalletAddress('0x12345678')).toBe('0x12345678');
    });

    it('should handle exactly 10 character addresses', () => {
      expect(formatWalletAddress('0x12345678')).toBe('0x12345678');
    });

    it('should handle 11 character addresses (minimum for truncation)', () => {
      expect(formatWalletAddress('0x123456789')).toBe('0x1234...6789');
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

describe('formatFlow', () => {
  describe('unit tests', () => {
    it('should format whole Flow amounts', () => {
      expect(formatFlow(100000000n)).toBe('1.00');
      expect(formatFlow(500000000n)).toBe('5.00');
      expect(formatFlow(10000000000n)).toBe('100.00');
    });

    it('should format fractional Flow amounts', () => {
      expect(formatFlow(150000000n)).toBe('1.50');
      expect(formatFlow(125000000n)).toBe('1.25');
      expect(formatFlow(101000000n)).toBe('1.01');
    });

    it('should format amounts less than 1 Flow', () => {
      expect(formatFlow(50000000n)).toBe('0.50');
      expect(formatFlow(12345678n)).toBe('0.12');
      expect(formatFlow(1000000n)).toBe('0.01');
    });

    it('should format zero amount', () => {
      expect(formatFlow(0n)).toBe('0.00');
    });

    it('should handle large amounts', () => {
      expect(formatFlow(100000000000000n)).toBe('1000000.00');
      expect(formatFlow(99999900000000n)).toBe('999999.00');
    });

    it('should always show 2 decimal places', () => {
      const formatted = formatFlow(123456789n);
      expect(formatted).toMatch(/^\d+\.\d{2}$/);
    });

    it('should round amounts with more than 2 decimals', () => {
      // 1.23456789 Flow should display as 1.23
      expect(formatFlow(123456789n)).toBe('1.23');
      // 1.99999999 Flow rounds to 2.00
      expect(formatFlow(199999999n)).toBe('2.00');
      // 1.99500000 Flow rounds to 2.00
      expect(formatFlow(199500000n)).toBe('2.00');
      // 1.99499999 Flow rounds to 1.99
      expect(formatFlow(199499999n)).toBe('1.99');
    });
  });
});

describe('toMicroFlow', () => {
  describe('unit tests', () => {
    it('should convert whole Flow amounts to micro-Flow', () => {
      expect(toMicroFlow(1)).toBe(100000000n);
      expect(toMicroFlow(5)).toBe(500000000n);
      expect(toMicroFlow(100)).toBe(10000000000n);
    });

    it('should convert fractional Flow amounts to micro-Flow', () => {
      expect(toMicroFlow(1.5)).toBe(150000000n);
      expect(toMicroFlow(0.5)).toBe(50000000n);
      expect(toMicroFlow(0.01)).toBe(1000000n);
    });

    it('should handle zero', () => {
      expect(toMicroFlow(0)).toBe(0n);
    });

    it('should handle very small amounts', () => {
      expect(toMicroFlow(0.00000001)).toBe(1n);
      expect(toMicroFlow(0.00000002)).toBe(2n);
    });

    it('should floor fractional micro-Flow values', () => {
      // 1.123456789 Flow = 112345678.9 micro-Flow, should floor to 112345678
      expect(toMicroFlow(1.123456789)).toBe(112345678n);
    });

    it('should handle large amounts', () => {
      expect(toMicroFlow(1000000)).toBe(100000000000000n);
    });
  });
});

describe('fromMicroFlow', () => {
  describe('unit tests', () => {
    it('should convert micro-Flow to Flow amounts', () => {
      expect(fromMicroFlow(100000000n)).toBe(1);
      expect(fromMicroFlow(500000000n)).toBe(5);
      expect(fromMicroFlow(10000000000n)).toBe(100);
    });

    it('should convert fractional amounts', () => {
      expect(fromMicroFlow(150000000n)).toBe(1.5);
      expect(fromMicroFlow(50000000n)).toBe(0.5);
      expect(fromMicroFlow(1000000n)).toBe(0.01);
    });

    it('should handle zero', () => {
      expect(fromMicroFlow(0n)).toBe(0);
    });

    it('should handle very small amounts', () => {
      expect(fromMicroFlow(1n)).toBe(0.00000001);
      expect(fromMicroFlow(10n)).toBe(0.0000001);
    });

    it('should handle large amounts', () => {
      expect(fromMicroFlow(100000000000000n)).toBe(1000000);
    });

    it('should be inverse of toMicroFlow for whole numbers', () => {
      expect(fromMicroFlow(toMicroFlow(1))).toBe(1);
      expect(fromMicroFlow(toMicroFlow(100))).toBe(100);
      expect(fromMicroFlow(toMicroFlow(1000))).toBe(1000);
    });
  });
});

describe('isValidFlowAddress', () => {
  describe('unit tests', () => {
    it('should accept valid Flow addresses', () => {
      expect(isValidFlowAddress('0x0123456789abcdef')).toBe(true);
      expect(isValidFlowAddress('0xABCDEF0123456789')).toBe(true);
      expect(isValidFlowAddress('0x1234567890ABCDEF')).toBe(true);
      expect(isValidFlowAddress('0xabcdefABCDEF0123')).toBe(true);
    });

    it('should reject addresses without 0x prefix', () => {
      expect(isValidFlowAddress('0123456789abcdef')).toBe(false);
      expect(isValidFlowAddress('1234567890ABCDEF')).toBe(false);
    });

    it('should reject addresses with wrong length', () => {
      expect(isValidFlowAddress('0x123')).toBe(false);
      expect(isValidFlowAddress('0x0123456789abcde')).toBe(false); // 15 chars
      expect(isValidFlowAddress('0x0123456789abcdef0')).toBe(false); // 17 chars
      expect(isValidFlowAddress('0x0123456789abcdef01')).toBe(false); // 18 chars
    });

    it('should reject addresses with non-hex characters', () => {
      expect(isValidFlowAddress('0x0123456789abcdeg')).toBe(false);
      expect(isValidFlowAddress('0x0123456789abcdez')).toBe(false);
      expect(isValidFlowAddress('0x0123456789abcd!f')).toBe(false);
      expect(isValidFlowAddress('0x0123456789 bcdef')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidFlowAddress('')).toBe(false);
    });

    it('should reject just 0x', () => {
      expect(isValidFlowAddress('0x')).toBe(false);
    });

    it('should reject addresses with uppercase X', () => {
      expect(isValidFlowAddress('0X0123456789abcdef')).toBe(false);
    });

    it('should accept mixed case hex characters', () => {
      expect(isValidFlowAddress('0xAbCdEf0123456789')).toBe(true);
      expect(isValidFlowAddress('0x0123456789AbCdEf')).toBe(true);
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
