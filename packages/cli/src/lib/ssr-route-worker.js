// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';

async function executeModule({ executeModuleUrl, moduleUrl, compilation, page, prerender = false, htmlContents = null, scripts = '[]' }) {
  const { executeRouteModule } = await import(executeModuleUrl);
  const data = await executeRouteModule({ moduleUrl, compilation: JSON.parse(compilation), page: JSON.parse(page), prerender, htmlContents, scripts: JSON.parse(scripts) });

  parentPort.postMessage(data);
}

parentPort.on('message', async (task) => {
  await executeModule(task);
});