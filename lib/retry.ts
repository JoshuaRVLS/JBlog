/**
 * Retry utility for database queries and other operations
 * Helps handle transient errors like connection timeouts
 */

interface RetryOptions {
  maxRetries?: number;
  delay?: number; // Initial delay in milliseconds
  backoff?: number; // Exponential backoff multiplier
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error is retryable (timeout, connection errors)
      const isRetryable = isRetryableError(error as Error);
      if (!isRetryable) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt);
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      } else {
        console.warn(
          `⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms:`,
          lastError.message
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 * @param error Error to check
 * @returns True if error is retryable
 */
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Connection timeout errors
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("econnreset")
  ) {
    return true;
  }

  // PostgreSQL specific errors
  if (
    errorName.includes("timeout") ||
    errorMessage.includes("pg") ||
    errorMessage.includes("prisma")
  ) {
    return true;
  }

  // Network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("socket") ||
    errorMessage.includes("eai_again")
  ) {
    return true;
  }

  return false;
}

/**
 * Retry a database query with automatic retry on timeout
 * @param queryFn Query function to retry
 * @param options Retry configuration
 * @returns Query result
 */
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retry(queryFn, {
    maxRetries: 3,
    delay: 1000,
    backoff: 2,
    onRetry: (error, attempt) => {
      console.warn(
        `🔄 Retrying database query (attempt ${attempt}):`,
        error.message
      );
    },
    ...options,
  });
}

