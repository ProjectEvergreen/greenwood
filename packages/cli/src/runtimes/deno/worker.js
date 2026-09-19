import module from "node:module";
import { getLoaderHooks } from "../loader.js";
import { startLoaderWorker } from "../worker.js";
import { denoLoaderHooks } from "./hooks.js";

const loaderReady = (() => {
  // This worker does not inherit the hooks registered by register.js, so apply
  // Deno compatibility before initializing the Greenwood loader engine.
  module.registerHooks(denoLoaderHooks);

  return getLoaderHooks();
})();

// Deno can drop messages sent before a worker attaches its listener, so start
// the protocol synchronously while loader initialization continues separately.
startLoaderWorker(loaderReady);
