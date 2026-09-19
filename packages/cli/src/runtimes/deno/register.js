import module from "node:module";
import { setEnvironmentData } from "node:worker_threads";
import { initializeSyncWorkerBridge } from "../bridge.js";
import { WORKER_IMPORTS_KEY } from "../worker-imports.js";
import { denoLoaderHooks } from "./hooks.js";

// Deno does not propagate --import/--preload modules to node:worker_threads, so publish this
// registration module for Greenwood's route workers to import explicitly.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
setEnvironmentData(WORKER_IMPORTS_KEY, [import.meta.url]);

module.registerHooks(
  initializeSyncWorkerBridge(new URL("./worker.js", import.meta.url), {
    // Let the outer Deno hook preserve the runtime's native ESM JSON handling.
    // Deno pre-validates bare CSS package imports before running load hooks, including on 2.9.7.
    // Resolve them first and mark URLs claimed by Greenwood so its load hook runs before validation.
    // https://github.com/ProjectEvergreen/greenwood/discussions/1810
    markHandledResolutions: true,
    resolveBareSpecifiers: true,
    shouldLoad: (url) => !url.pathname.endsWith(".json"),
    shouldResolve: (url) => !url.pathname.endsWith(".json"),
    workerOptions: {
      execArgv: [],
    },
  }),
);

// registerHooks() chains run last-in, first-out. Register these last so Deno-specific cases run
// before the generic Greenwood resource pipeline and can short-circuit it when necessary.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
module.registerHooks(denoLoaderHooks);
