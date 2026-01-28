/**
 * Retry utility for database operations
 * 
 * Implements exponential backoff for failed database queries
 * Requirements: 7.5
 */

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100, // 100ms
  maxDelay: 2000, // 2 seconds
  backoffMultiplier: 2,
};

/**
 * Retry a database operation with exponential backoff
 * 
 * @param operation Function to retry
 * @param options Retry options
 * @returns Result of the operation
 * @throws Error if all attempts fail
 * 
 * Requirements: 7.5
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this was the last attempt, throw the error
      if (attempt === opts.maxAttempts) {
        console.error(
          `Database operation failed after ${opts.maxAttempts} attempts:`,
          lastError
        );
        throw lastError;
      }

      // Log the retry attempt
      console.warn(
        `Database operation failed (attempt ${attempt}/${opts.maxAttempts}), retrying in ${delay}ms...`,
        lastError.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error during retry');
}

/**
 * Check if an error is retryable
 * 
 * @param error Error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  
  // Common retryable database errors
  const retryablePatterns = [
    'connection',
    'timeout',
    'network',
    'econnrefused',
    'enotfound',
    'etimedout',
    'temporary',
    'unavailable',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}
