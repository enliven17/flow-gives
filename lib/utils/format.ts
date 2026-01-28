/**
 * Formatting utility functions for StacksGives crowdfunding platform
 * 
 * These functions handle display formatting for various data types including
 * wallet addresses, USDCx amounts, funding percentages, and time remaining.
 * 
 * Validates: Requirements 4.3, 4.5, 6.6
 */

/**
 * Calculate the funding percentage for a project
 * 
 * Formula: (totalRaised / fundingGoal) * 100
 * 
 * @param totalRaised - Amount raised in micro-USDCx
 * @param fundingGoal - Funding goal in micro-USDCx
 * @returns Percentage of goal achieved (0-100+), or 0 if goal is 0
 * 
 * @example
 * calculateFundingPercentage(50000000n, 100000000n) // Returns 50
 * calculateFundingPercentage(150000000n, 100000000n) // Returns 150 (overfunded)
 * calculateFundingPercentage(0n, 100000000n) // Returns 0
 * 
 * Validates: Requirements 4.3
 */
export function calculateFundingPercentage(
  totalRaised: bigint,
  fundingGoal: bigint
): number {
  if (fundingGoal <= 0n) {
    return 0;
  }
  
  // Calculate percentage using bigint arithmetic to avoid precision loss
  // Then convert to number for display
  const percentage = (totalRaised * 100n) / fundingGoal;
  return Number(percentage);
}

/**
 * Calculate the time remaining until a deadline
 * 
 * @param deadline - The deadline date
 * @param currentTime - Optional current time (defaults to now)
 * @returns Time remaining in milliseconds (positive if future, negative if past)
 * 
 * @example
 * const deadline = new Date('2024-12-31');
 * calculateTimeRemaining(deadline) // Returns milliseconds until deadline
 * 
 * Validates: Requirements 4.5
 */
export function calculateTimeRemaining(
  deadline: Date,
  currentTime: Date = new Date()
): number {
  return deadline.getTime() - currentTime.getTime();
}

/**
 * Format a wallet address for display by truncating the middle
 * 
 * Shows first 6 characters and last 4 characters with "..." in between
 * for privacy and space efficiency.
 * 
 * @param address - Full wallet address
 * @returns Truncated address (e.g., "ST1X6Y...AB12")
 * 
 * @example
 * formatWalletAddress('ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P') 
 * // Returns "ST1X6Y...N7O8P"
 * 
 * Validates: Requirements 6.6
 */
export function formatWalletAddress(address: string): string {
  if (address.length <= 10) {
    return address; // Too short to truncate meaningfully
  }
  
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
}

/**
 * Format micro-USDCx amount to display string with 2 decimal places
 * 
 * Converts from micro-USDCx (6 decimals) to USDCx display format.
 * 1 USDCx = 1,000,000 micro-USDCx
 * 
 * @param microUsdcx - Amount in micro-USDCx (smallest unit)
 * @returns Formatted string with 2 decimal places (e.g., "1.50")
 * 
 * @example
 * formatUSDCx(1000000n) // Returns "1.00"
 * formatUSDCx(1500000n) // Returns "1.50"
 * formatUSDCx(123456n) // Returns "0.12"
 * 
 * Validates: Requirements 4.1, 4.2
 */
export function formatUSDCx(microUsdcx: bigint): string {
  const usdcx = Number(microUsdcx) / 1_000_000;
  return usdcx.toFixed(2);
}

/**
 * Format time remaining into a human-readable string
 * 
 * Converts milliseconds into days, hours, or minutes depending on magnitude.
 * 
 * @param milliseconds - Time remaining in milliseconds
 * @returns Human-readable string (e.g., "5 days", "3 hours", "45 minutes")
 * 
 * @example
 * formatTimeRemaining(432000000) // Returns "5 days"
 * formatTimeRemaining(10800000) // Returns "3 hours"
 * formatTimeRemaining(2700000) // Returns "45 minutes"
 * formatTimeRemaining(-1000) // Returns "Expired"
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds < 0) {
    return 'Expired';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    return 'Less than a minute';
  }
}
