import fs from 'node:fs/promises';

// Small helper to retry copyFile on transient errors (EBUSY on Windows CI).
// Attempts: number of tries (default 5)
// baseDelay: starting delay in ms for exponential backoff (default 100ms)
async function copyFileWithRetry(source, target, { attempts = 5, baseDelay = 100 } = {}) {
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fs.copyFile(source, target);
    } catch (err) {
      lastError = err;

      // Only retry for transient EBUSY / EPERM on Windows or generic resource busy errors
      if ((err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') && i < attempts - 1) {
        const delay = baseDelay * Math.pow(2, i);
        // add small jitter
        const jitter = Math.floor(Math.random() * baseDelay);
        await new Promise((res) => setTimeout(res, delay + jitter));
        continue;
      }

      // non-retryable or last attempt -> rethrow
      throw err;
    }
  }

  // if we exhausted loop, throw last seen error
  throw lastError;
}

export { copyFileWithRetry };
