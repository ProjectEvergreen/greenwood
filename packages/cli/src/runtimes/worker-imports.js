import { getEnvironmentData } from "node:worker_threads";

const WORKER_IMPORTS_KEY = "@greenwood/worker-imports";

/**
 * Starts runtime-specific imports inside a route worker.
 *
 * Deno publishes its registration URL in worker environment data; its preloads do not reach workers.
 * Callers attach the message listener immediately, then await this before importing route code;
 * Deno can drop messages sent before the listener exists.
 * https://github.com/ProjectEvergreen/greenwood/discussions/1810
 */
async function initializeWorkerImports() {
  const workerImports = getEnvironmentData(WORKER_IMPORTS_KEY) ?? [];

  for (const specifier of workerImports) {
    await import(specifier);
  }
}

export { initializeWorkerImports, WORKER_IMPORTS_KEY };
