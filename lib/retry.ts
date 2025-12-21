// Utility untuk retry operasi yang gagal, khususnya untuk error timeout database

interface RetryOptions {
  maxRetries?: number;
  delay?: number; // delay awal dalam ms
  backoff?: number; // multiplier untuk exponential backoff
  onRetry?: (error: Error, attempt: number) => void;
}
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
      
      // Kalau sudah attempt terakhir, langsung throw error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Cek apakah error bisa di-retry (timeout, connection error, dll)
      const isRetryable = isRetryableError(error as Error);
      if (!isRetryable) {
        throw lastError;
      }

      // Hitung delay dengan exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt);
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      } else {
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} setelah ${waitTime}ms:`,
          lastError.message
        );
      }

      // Tunggu sebentar sebelum retry lagi
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// Cek apakah error bisa di-retry atau tidak
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Error timeout atau connection
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("econnreset")
  ) {
    return true;
  }

  // Error khusus PostgreSQL/Prisma
  if (
    errorName.includes("timeout") ||
    errorMessage.includes("pg") ||
    errorMessage.includes("prisma")
  ) {
    return true;
  }

  // Error network
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("socket") ||
    errorMessage.includes("eai_again")
  ) {
    return true;
  }

  return false;
}

// Retry khusus untuk database query
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
        `Retrying database query (attempt ${attempt}):`,
        error.message
      );
    },
    ...options,
  });
}

