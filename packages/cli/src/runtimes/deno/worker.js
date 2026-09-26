import module from "node:module";
import { getLoaderHooks } from "../loader.js";
import { startLoaderWorker } from "../worker.js";
import { denoLoaderHooks } from "./hooks.js";

const loaderReady = (() => {
  // Hooks are local to this worker; register Deno's fixes before loading Greenwood's plugins.
  // https://github.com/ProjectEvergreen/greenwood/discussions/1810
  module.registerHooks(denoLoaderHooks);

  return getLoaderHooks();
})();

// Attach the listener now; Deno 2.9.7 can drop messages sent before it exists.
// https://github.com/ProjectEvergreen/greenwood/discussions/1810
startLoaderWorker(loaderReady);
