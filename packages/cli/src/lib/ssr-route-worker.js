// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { registerWorkerHandler } from "../runtimes/worker.js";

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
  params,
}) {
  const parsedCompilation = JSON.parse(compilation);

  if (prerender) {
    // Set framework state before component imports load the Content-as-Data client.
    globalThis.__GWD_BASE_PATH__ = parsedCompilation.config.basePath;
    globalThis.__CONTENT_OPTIONS__ = {
      PORT: parsedCompilation.config.devServer.port,
      PRERENDER: "true",
    };
  }

  const { executeRouteModule } = await import(executeModuleUrl);
  const data = await executeRouteModule({
    moduleUrl,
    compilation: parsedCompilation,
    page: JSON.parse(page),
    prerender,
    htmlContents,
    scripts: JSON.parse(scripts),
    request,
    contentOptions: JSON.parse(contentOptions),
    params: params ? JSON.parse(params) : params,
  });

  parentPort.postMessage(data);
}

registerWorkerHandler(executeModule);
