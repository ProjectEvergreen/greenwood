import { getEnvironmentData } from "node:worker_threads";

const WORKER_IMPORTS_KEY = "@greenwood/worker-imports";

/**
 * Registers runtime-specific imports inside a worker thread.
 *
 * Runtime entry points publish module specifiers through worker environment data when the runtime
 * does not propagate preload imports to child workers. Importing each specifier initializes its
 * loader hooks before the worker executes a route module.
 */
async function initializeWorkerImports() {
  const workerImports = getEnvironmentData(WORKER_IMPORTS_KEY) ?? [];

  for (const specifier of workerImports) {
    await import(specifier);
  }
}

export { initializeWorkerImports, WORKER_IMPORTS_KEY };
