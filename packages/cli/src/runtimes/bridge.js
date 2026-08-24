// bridge inspired by feedback / examples provided in this GitHub issue
// https://github.com/nodejs/loaders/issues/201
import { MessageChannel, receiveMessageOnPort, Worker } from "node:worker_threads";

const DEFAULT_TIMEOUT = 30_000;
const FALLBACK_LOAD_ERROR_CODES = new Set([
  "ERR_IMPORT_ATTRIBUTE_MISSING",
  "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED",
  "ERR_UNKNOWN_FILE_EXTENSION",
]);

function hasCondition(context, condition) {
  return context.conditions?.includes?.(condition) ?? context.conditions?.has?.(condition) ?? false;
}

function deserializeError(serializedError) {
  const error = new Error(serializedError.message);

  error.name = serializedError.name;
  error.stack = serializedError.stack;

  return error;
}

class SyncLoaderBridge {
  constructor(workerUrl, workerOptions = {}, timeout = DEFAULT_TIMEOUT) {
    const { port1, port2 } = new MessageChannel();

    this.port = port1;
    this.requestId = 0;
    this.timeout = timeout;
    this.worker = new Worker(workerUrl, workerOptions);
    this.worker.postMessage({ port: port2 }, [port2]);
    this.port.unref();
    this.worker.unref();
  }

  dispatch(action, url) {
    const id = this.requestId++;
    const signal = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    const state = new Int32Array(signal);

    this.port.postMessage({
      action,
      id,
      signal,
      url,
    });

    if (Atomics.wait(state, 0, 0, this.timeout) === "timed-out") {
      this.worker.terminate();
      throw new Error(`Timed out waiting for Greenwood's ${action} loader hook for ${url}`);
    }

    const response = receiveMessageOnPort(this.port)?.message;

    if (!response || response.id !== id) {
      throw new Error(`Greenwood's ${action} loader hook returned no response for ${url}`);
    }

    if (response.error) {
      throw deserializeError(response.error);
    }

    return response.result;
  }
}

function createSyncLoaderHooks(workerUrl, options = {}) {
  const bridge = new SyncLoaderBridge(workerUrl, options.workerOptions, options.timeout);

  return {
    resolve(specifier, context, nextResolve) {
      // delegate CJS (`require`) calls the loader system
      if (!options.includeRequire && hasCondition(context, "require")) {
        return nextResolve(specifier, context);
      }

      const { parentURL } = context;
      const url = specifier.startsWith("file://")
        ? new URL(specifier)
        : specifier.startsWith(".") && parentURL
          ? new URL(specifier, parentURL)
          : undefined;
      const shouldDispatch = url && (options.shouldResolve?.(url, context) ?? true);

      if (shouldDispatch && bridge.dispatch("resolve", url.href).shouldHandle) {
        return {
          url: url.href,
          shortCircuit: true,
        };
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      const moduleUrl = new URL(url);

      // delegate node internals the loader system
      if (moduleUrl.protocol === "node:") {
        return nextLoad(url, context);
      }

      // delegate CJS (`require`) calls the loader system
      if (
        !options.includeRequire &&
        (hasCondition(context, "require") || context.format?.startsWith("commonjs"))
      ) {
        return nextLoad(url, context);
      }

      // Synchronous hooks always run before asynchronous hooks. Give a downstream hook (such as
      // Lit's CSS import hook) the first chance to handle explicit import attributes, preserving
      // the effective LIFO behavior Greenwood had when all hooks were asynchronous.
      if (Object.keys(context.importAttributes ?? {}).length > 0) {
        try {
          return nextLoad(url, context);
        } catch (error) {
          if (!FALLBACK_LOAD_ERROR_CODES.has(error.code)) {
            throw error;
          }
        }
      }

      if (!(options.shouldLoad?.(moduleUrl, context) ?? true)) {
        return nextLoad(url, context);
      }

      const result = bridge.dispatch("load", url);

      return result ?? nextLoad(url, context);
    },
  };
}

export { createSyncLoaderHooks };
