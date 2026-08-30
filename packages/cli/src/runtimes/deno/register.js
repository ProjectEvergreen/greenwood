import module from "node:module";
import { setEnvironmentData } from "node:worker_threads";
import { initializeSyncWorkerBridge } from "../bridge.js";
import { WORKER_IMPORTS_KEY } from "../worker-imports.js";
import { denoLoaderHooks } from "./hooks.js";

// Deno does not currently propagate --import preloads to node:worker_threads.
// Publish this loader's URL so worker entry points can preload it without
// knowing anything about the loader or the externals it handles.
// https://github.com/denoland/deno/issues/31992
setEnvironmentData(WORKER_IMPORTS_KEY, [import.meta.url]);

module.registerHooks(
  initializeSyncWorkerBridge(new URL("./worker.js", import.meta.url), {
    // Let the outer compatibility hook preserve Deno's native JSON semantics.
    // Deno pre-validates bare CSS package imports before running load hooks. Resolve them first and
    // mark the URLs Greenwood can load so the bridge can transform them before Deno validates them.
    markHandledResolutions: true,
    resolveBareSpecifiers: true,
    shouldLoad: (url) => !url.pathname.endsWith(".json"),
    shouldResolve: (url) => !url.pathname.endsWith(".json"),
    workerOptions: {
      execArgv: [],
    },
  }),
);

// Register these last so Deno-specific cases run before the generic Greenwood
// resource pipeline and can short-circuit it when necessary.
module.registerHooks(denoLoaderHooks);
