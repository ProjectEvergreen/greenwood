import module from "node:module";
import { setEnvironmentData } from "node:worker_threads";
import { initializeSyncWorkerBridge } from "../bridge.js";
import { WORKER_IMPORTS_KEY } from "../worker-imports.js";
import { denoLoaderHooks } from "./hooks.js";

// Deno does not pass preloads to route workers,
// so publish this module's URL so each worker can register the same loader hooks before importing user code.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
setEnvironmentData(WORKER_IMPORTS_KEY, [import.meta.url]);

module.registerHooks(
  initializeSyncWorkerBridge(new URL("./worker.js", import.meta.url), {
    // Deno validates bare CSS imports before load(), so mark resolved URLs that get handled by Greenwood
    // https://github.com/ProjectEvergreen/greenwood/discussions/1810
    markHandledResolutions: true,
    resolveBareSpecifiers: true,
    // Leave JSON imports to Deno's native ESM handling
    shouldLoad: (url) => !url.pathname.endsWith(".json"),
    shouldResolve: (url) => !url.pathname.endsWith(".json"),
    workerOptions: {
      execArgv: [],
    },
  }),
);

// Hooks run last-in, first-out; Deno's fixes must run before Greenwood's resource hooks.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
module.registerHooks(denoLoaderHooks);
