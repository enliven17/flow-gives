/**
 * Formatting utility functions for FlowGives crowdfunding platform
 * 
 * These functions handle display formatting for various data types including
 * wallet addresses, Flow amounts, funding percentages, and time remaining.
 * 
 * Requirements: 4.3, 4.5, 6.6, 8.1, 8.2, 8.6, 8.7, 11.6
 */

/**
 * Calculate the funding percentage for a project
 * 
 * Formula: (totalRaised / fundingGoal) * 100
 * 
 * @param totalRaised - Amount raised in micro-Flow
 * @param fundingGoal - Funding goal in micro-Flow
 * @returns Percentage of goal achieved (0-100+), or 0 if goal is 0
 * 
 * @example
 * calculateFundingPercentage(50000000n, 100000000n) // Returns 50
 * calculateFundingPercentage(150000000n, 100000000n) // Returns 150 (overfunded)
 * calculateFundingPercentage(0n, 100000000n) // Returns 0
 * 
 * Requirements: 4.3
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
 * @returns Truncated address (e.g., "0x1234...5678")
 * 
 * @example
 * formatWalletAddress('0x1234567890abcdef') 
 * // Returns "0x1234...cdef"
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
 * Format micro-Flow amount to display string with 2 decimal places
 * 
 * Converts from micro-Flow (8 decimals) to Flow display format.
 * 1 FLOW = 100,000,000 micro-Flow
 * 
 * @param microFlow - Amount in micro-Flow (smallest unit)
 * @returns Formatted string with 2 decimal places (e.g., "1.50")
 * 
 * @example
 * formatFlow(100000000n) // Returns "1.00"
 * formatFlow(150000000n) // Returns "1.50"
 * formatFlow(12345678n) // Returns "0.12"
 * 
 * Requirements: 8.1, 8.2, 8.6
 */
export function formatFlow(microFlow: bigint): string {
  const flow = Number(microFlow) / 100_000_000;
  return flow.toFixed(2);
}

/**
 * Convert Flow to micro-Flow
 * 
 * @param flow - Amount in Flow tokens
 * @returns Amount in micro-Flow (8 decimals)
 * 
 * Requirements: 8.7
 */
export function toMicroFlow(flow: number): bigint {
  return BigInt(Math.floor(flow * 100_000_000));
}

/**
 * Convert micro-Flow to Flow
 * 
 * @param microFlow - Amount in micro-Flow
 * @returns Amount in Flow tokens
 * 
 * Requirements: 8.7
 */
export function fromMicroFlow(microFlow: bigint): number {
  return Number(microFlow) / 100_000_000;
}

/**
 * Validate Flow address format
 * 
 * @param address - Flow address to validate
 * @returns true if valid Flow address format
 * 
 * Requirements: 11.6
 */
export function isValidFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
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
