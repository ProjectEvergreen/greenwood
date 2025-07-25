// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";

async function executeModule({
  executeModuleUrl,
  moduleUrl,
  compilation = "{}",
  page = "{}",
  prerender = false,
  htmlContents = null,
  scripts = "[]",
  request,
  contentOptions = "{}",
}) {
  const { executeRouteModule } = await import(executeModuleUrl);
  const data = await executeRouteModule({
    moduleUrl,
    compilation: JSON.parse(compilation),
    page: JSON.parse(page),
    prerender,
    htmlContents,
    scripts: JSON.parse(scripts),
    request,
    contentOptions: JSON.parse(contentOptions),
  });

  parentPort.postMessage(data);
}

parentPort.on("message", async (task) => {
  await executeModule(task);
});
