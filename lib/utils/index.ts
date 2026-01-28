/**
 * Utility functions for FlowGives crowdfunding platform
 * 
 * This module exports formatting and calculation utilities used throughout
 * the application for consistent data display and computation.
 */

export {
  calculateFundingPercentage,
  calculateTimeRemaining,
  formatWalletAddress,
  formatFlow,
  formatTimeRemaining,
  toMicroFlow,
  fromMicroFlow,
  isValidFlowAddress,
} from './format';

export {
  retryDatabaseOperation,
  isRetryableError,
  type RetryOptions,
} from './retry';
