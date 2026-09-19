import module from "node:module";
import { getLoaderHooks } from "../loader.js";
import { startLoaderWorker } from "../worker.js";
import { denoLoaderHooks } from "./hooks.js";

const loaderReady = (() => {
  // Loader hooks are scoped to each worker isolate, so apply Deno compatibility in this worker
  // before initializing the Greenwood loader engine.
  // https://github.com/ProjectEvergreen/greenwood/discussions/1810
  module.registerHooks(denoLoaderHooks);

  return getLoaderHooks();
})();

// Deno 2.9.7 drops messages sent before a node:worker_threads listener is attached, so start the
// protocol synchronously while loader initialization continues separately.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
startLoaderWorker(loaderReady);
