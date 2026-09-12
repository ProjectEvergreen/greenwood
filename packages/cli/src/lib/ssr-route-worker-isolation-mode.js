// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { initializeWorkerImports } from "../runtimes/worker-imports.js";

const workerImportsReady = initializeWorkerImports();

async function executeModule({ routeModuleUrl, request, compilation }) {
  const { handler } = await import(routeModuleUrl);
  const response = await handler(request, compilation);
  const html = await response.text();

  parentPort.postMessage(html);
}

parentPort.on("message", async (task) => {
  await workerImportsReady;
  await executeModule(task);
});
