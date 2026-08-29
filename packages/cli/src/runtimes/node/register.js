// entry point for NodeJS custom loader hooks, e.g. `node --import @greenwood/cli/register`
import { registerHooks } from "node:module";
import { SHARE_ENV, workerData } from "node:worker_threads";
import { initializeSyncWorkerBridge } from "../bridge.js";

const GREENWOOD_LOADER_NODE_REGISTER = "greenwood-loader-node-register";

// Node propagates `--import` preloads from `NODE_OPTIONS` into workers,
// and Greenwood’s register module creates its own worker so that worker preloads the register module again and the synchronous bridge deadlocks.
// we use a guard here to prevent the worker backing the bridge from registering another bridge when this module is preloaded through `NODE_OPTIONS`
// https://nodejs.org/download/release/v24.13.1/docs/api/cli.html#--importmodule
// https://github.com/ProjectEvergreen/greenwood/pull/1795
if (workerData !== GREENWOOD_LOADER_NODE_REGISTER) {
  registerHooks(
    initializeSyncWorkerBridge(new URL("./worker.js", import.meta.url), {
      workerOptions: {
        // share read / write access to process.env across parent / child worker threads, like `__GWD_COMMAND__`
        // https://nodejs.org/docs/latest-v24.x/api/worker_threads.html#worker_threadsshare_env
        env: SHARE_ENV,
        // send `[]` to prevent the initial loader hook (--import @greenwood/cli/register``) from inheriting itself as part of `process.execArgv`
        // and thus have register calling itself recursively
        execArgv: [],
        workerData: GREENWOOD_LOADER_NODE_REGISTER,
      },
    }),
  );
}
