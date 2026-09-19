// bridge inspired by feedback / examples provided in this GitHub issue
// https://github.com/nodejs/loaders/issues/201
import { MessageChannel, receiveMessageOnPort, Worker } from "node:worker_threads";

const DEFAULT_TIMEOUT = 30_000;
// Carries the fact that Greenwood claimed a bare specifier from resolve() into load(). The marker
// is internal to the bridge and is removed before the URL reaches Greenwood's resource plugins.
const HANDLED_RESOLUTION_PARAM = "__greenwood";
const FALLBACK_LOAD_ERROR_CODES = new Set([
  "ERR_IMPORT_ATTRIBUTE_MISSING",
  "ERR_IMPORT_ATTRIBUTE_UNSUPPORTED",
  "ERR_UNKNOWN_FILE_EXTENSION",
]);

function hasCondition(context, condition) {
  return context.conditions?.includes?.(condition) ?? context.conditions?.has?.(condition) ?? false;
}

// Node identifies unsupported loader inputs with stable error codes, while Deno reports an
// untagged TypeError for unsupported import attributes. Recognize both forms so Greenwood's
// resource pipeline gets the same opportunity to transform the input in either runtime.
function isFallbackLoadError(error) {
  return (
    FALLBACK_LOAD_ERROR_CODES.has(error.code) ||
    (error.name === "TypeError" &&
      /^The import attribute type of ".+" is unsupported\./.test(error.message))
  );
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
    const completionSignal = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    const state = new Int32Array(completionSignal);

    this.port.postMessage({
      action,
      id,
      completionSignal,
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

function initializeSyncWorkerBridge(workerUrl, options = {}) {
  const bridge = new SyncLoaderBridge(workerUrl, options.workerOptions, options.timeout);

  return {
    resolve(specifier, context, nextResolve) {
      // delegate CJS (`require`) calls the loader system
      if (!options.includeRequire && hasCondition(context, "require")) {
        return nextResolve(specifier, context);
      }

      const { parentURL } = context;
      let resolution;
      let url = specifier.startsWith("file://")
        ? new URL(specifier)
        : specifier.startsWith(".") && parentURL
          ? new URL(specifier, parentURL)
          : undefined;

      // File and relative specifiers can be checked directly, but bare package specifiers must
      // first go through the runtime resolver before Greenwood can inspect their resolved file URL.
      if (!url && options.resolveBareSpecifiers) {
        resolution = nextResolve(specifier, context);

        if (resolution.url?.startsWith("file://")) {
          url = new URL(resolution.url);
        }
      }

      const shouldDispatch = url && (options.shouldResolve?.(url, context) ?? true);

      if (shouldDispatch && bridge.dispatch("resolve", url.href).shouldHandle) {
        // Preserve the resolved package metadata while marking the URL as owned by Greenwood. Some
        // runtimes otherwise validate the resolved file type before invoking Greenwood's load hook.
        if (resolution && options.markHandledResolutions) {
          url.searchParams.set(HANDLED_RESOLUTION_PARAM, "");
        }

        return {
          ...resolution,
          url: url.href,
          shortCircuit: true,
        };
      }

      return resolution ?? nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      const moduleUrl = new URL(url);
      const loaderUrl = new URL(moduleUrl);
      const isHandledResolution = loaderUrl.searchParams.has(HANDLED_RESOLUTION_PARAM);
      let downstreamResult;

      // Downstream hooks still receive the module's marked identity, while Greenwood reads and
      // transforms the original URL so query metadata never leaks into resource handling.
      loaderUrl.searchParams.delete(HANDLED_RESOLUTION_PARAM);

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
      // the effective LIFO behavior Greenwood had when all hooks were asynchronous. A marked
      // resolution has already been claimed by Greenwood and must skip runtime validation here.
      if (!isHandledResolution && Object.keys(context.importAttributes ?? {}).length > 0) {
        try {
          downstreamResult = nextLoad(url, context);

          // Deno returns unhandled resources with their raw source and no format. Continue through
          // Greenwood's resource pipeline so files such as CSS are transformed into modules.
          if (downstreamResult.format) {
            return downstreamResult;
          }
        } catch (error) {
          if (!isFallbackLoadError(error)) {
            throw error;
          }
        }
      }

      if (!(options.shouldLoad?.(moduleUrl, context) ?? true)) {
        return nextLoad(url, context);
      }

      const result = bridge.dispatch("load", loaderUrl.href);

      return result ?? downstreamResult ?? nextLoad(url, context);
    },
  };
}

export { initializeSyncWorkerBridge };
