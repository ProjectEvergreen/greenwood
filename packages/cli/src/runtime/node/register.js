import { registerHooks } from "node:module";
import { SHARE_ENV } from "node:worker_threads";
import { createSyncLoaderHooks } from "../bridge.js";

registerHooks(
  createSyncLoaderHooks(new URL("./worker.js", import.meta.url), {
    workerOptions: {
      // share read / write access to process.env across parent / child worker threads, like `__GWD_COMMAND__`
      // https://nodejs.org/docs/latest-v24.x/api/worker_threads.html#worker_threadsshare_env
      env: SHARE_ENV,
      // send `[]` to prevent the initial loader hook (`--import @greenwood/cli/register`) from inheriting itself as part of `process.execArgv`
      // and thus have register calling itself recursively
      execArgv: [],
    },
  }),
);
