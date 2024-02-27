// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';

async function executeModule({ routeModuleUrl, request, compilation }) {
  const { handler } = await import(routeModuleUrl);
  const response = await handler(request, compilation);
  const html = await response.text();

  parentPort.postMessage(html);
}

parentPort.on('message', async (task) => {
  await executeModule(task);
});