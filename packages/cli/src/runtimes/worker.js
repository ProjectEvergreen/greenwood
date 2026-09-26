import { getEnvironmentData, parentPort } from "node:worker_threads";

const WORKER_IMPORTS_KEY = "@greenwood/worker-imports";

/**
 * Starts runtime-specific imports inside a route worker.
 *
 * Deno publishes its registration URL in worker environment data; its preloads do not reach workers.
 * https://github.com/ProjectEvergreen/greenwood/discussions/1810
 */
async function initializeWorkerImports() {
  const workerImports = getEnvironmentData(WORKER_IMPORTS_KEY) ?? [];

  for (const specifier of workerImports) {
    await import(specifier);
  }
}

/** Attach the listener before waiting for imports; some runtimes drop earlier messages. */
function registerWorkerHandler(runTask) {
  const workerImportsReady = initializeWorkerImports();

  parentPort.on("message", async (task) => {
    await workerImportsReady;
    await runTask(task);
  });
}

function serializeError(error) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  return {
    message: normalizedError.message,
    name: normalizedError.name,
    stack: normalizedError.stack,
  };
}

function startLoaderWorker(loaderReady) {
  parentPort.once("message", ({ port }) => {
    port.on("message", async ({ action, id, completionSignal, url }) => {
      const state = new Int32Array(completionSignal);
      let message;

      try {
        const loader = await loaderReady;

        message = {
          id,
          result: await loader[action](url),
        };
      } catch (error) {
        message = {
          error: serializeError(error),
          id,
        };
      }

      try {
        port.postMessage(message);
      } catch (error) {
        port.postMessage({
          error: serializeError(error),
          id,
        });
      } finally {
        Atomics.store(state, 0, 1);
        Atomics.notify(state, 0);
      }
    });
  });
}

export { registerWorkerHandler, startLoaderWorker, WORKER_IMPORTS_KEY };
