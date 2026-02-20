import { isDbUnavailable, logDbErrorInDev } from "./prisma-errors";

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 150;
  const maxDelayMs = options.maxDelayMs ?? 1200;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!isDbUnavailable(error) || attempt >= retries) {
        throw error;
      }

      const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      logDbErrorInDev("retryWithBackoff", error);
      await sleep(delayMs);
      attempt += 1;
    }
  }
};
