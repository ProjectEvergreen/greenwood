// shared worker implementation to be leveraged by all runtimes
import { parentPort } from "node:worker_threads";

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

export { startLoaderWorker };
