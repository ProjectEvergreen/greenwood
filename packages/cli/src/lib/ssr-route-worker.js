// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';

async function executeModule({ executeRouteModuleUrl, moduleUrl, compilation, route, label, id, prerender, htmlContents, scripts = '[]' }) {
  const { executeRouteModule } = await import(executeRouteModuleUrl);
  const data = await executeRouteModule({ moduleUrl, compilation: JSON.parse(compilation), route, label, id, prerender, htmlContents, scripts: JSON.parse(scripts) });

  parentPort.postMessage(data);
}

parentPort.on('message', async (task) => {
  await executeModule(task);
});