// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from "node:worker_threads";
import { transformKoaRequestIntoStandardRequest, responseAsObject } from "./resource-utils.js";

async function executeSitemapModule({ href, request, compilation }) {
  const { body, headers = {}, method, url } = request;
  // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
  const { handler } = await import(new URL(href));

  if (typeof handler !== "function") {
    throw new Error(
      `provided sitemap file => ${new URL(href).pathname} does not export a handler function.`,
    );
  }

  const response = await handler(
    transformKoaRequestIntoStandardRequest(new URL(url), {
      method,
      header: headers,
      body,
    }),
    {
      compilation: JSON.parse(compilation),
    },
  );

  parentPort.postMessage(await responseAsObject(response));
}

parentPort.on("message", async (task) => {
  await executeSitemapModule(task);
});
