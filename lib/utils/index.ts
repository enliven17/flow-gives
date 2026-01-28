/**
 * Utility functions for StacksGives crowdfunding platform
 * 
 * This module exports formatting and calculation utilities used throughout
 * the application for consistent data display and computation.
 */

export {
  calculateFundingPercentage,
  calculateTimeRemaining,
  formatWalletAddress,
  formatUSDCx,
  formatTimeRemaining,
} from './format';

export {
  retryDatabaseOperation,
  isRetryableError,
  type RetryOptions,
} from './retry';
