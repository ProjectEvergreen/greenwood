// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { transformKoaRequestIntoStandardRequest, responseAsObject } from "./resource-utils.js";

async function executeRouteModule({ href, request, params }) {
  const { body, headers = {}, method, url } = request;
  const contentType = headers["content-type"] || "";
  // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
  const { handler } = await import(new URL(href));
  const format = contentType.startsWith("application/json") ? JSON.parse(body) : body;

  // handling of serialized FormData across Worker threads
  if (contentType.startsWith("x-greenwood/www-form-urlencoded")) {
    headers["content-type"] = "application/x-www-form-urlencoded";
  }

  const response = await handler(
    transformKoaRequestIntoStandardRequest(new URL(url), {
      method,
      header: headers,
      body: format,
    }),
    {
      params,
    },
  );

  parentPort.postMessage(await responseAsObject(response));
}

parentPort.on("message", async (task) => {
  await executeRouteModule(task);
});
