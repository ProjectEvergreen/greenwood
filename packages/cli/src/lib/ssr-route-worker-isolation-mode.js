// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { registerWorkerHandler } from "../runtimes/worker.js";

async function executeModule({ routeModuleUrl, request, params }) {
  const { handler } = await import(routeModuleUrl);
  const response = await handler(request, params ? JSON.parse(params) : params);
  const html = await response.text();

  parentPort.postMessage(html);
}

registerWorkerHandler(executeModule);
