import { initializeLoader } from "../loader.js";
import { startLoaderWorker } from "../worker.js";

startLoaderWorker(initializeLoader());
