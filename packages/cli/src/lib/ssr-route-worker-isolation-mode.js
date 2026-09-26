// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { registerWorkerHandler } from "../runtimes/worker.js";

async function executeModule({ routeModuleUrl, request, compilation }) {
  const { handler } = await import(routeModuleUrl);
  const response = await handler(request, compilation);
  const html = await response.text();

  parentPort.postMessage(html);
}

registerWorkerHandler(executeModule);
