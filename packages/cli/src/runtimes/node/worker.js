import { getLoaderHooks } from "../loader.js";
import { startLoaderWorker } from "../worker.js";

startLoaderWorker(getLoaderHooks());
