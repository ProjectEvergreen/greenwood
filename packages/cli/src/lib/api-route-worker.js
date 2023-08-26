// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';
import { transformKoaRequestIntoStandardRequest } from './resource-utils.js';

// based on https://stackoverflow.com/questions/57447685/how-can-i-convert-a-request-object-into-a-stringifiable-object-in-javascript
async function responseAsObject (response) {
  if (!response instanceof Response) {
    throw Object.assign(
      new Error(),
      { name: 'TypeError', message: 'Argument must be a Response object' }
    );
  }
  response = response.clone();

  function stringifiableObject (obj) {
    const filtered = {};
    for (const key in obj) {
      if (['boolean', 'number', 'string'].includes(typeof obj[key]) || obj[key] === null) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  }

  return {
    ...stringifiableObject(response),
    headers: Object.fromEntries(response.headers),
    body: await response.text()
  };
}

async function executeRouteModule({ href, request }) {
  const { body, headers = {}, method, url } = request;
  const contentType = headers['content-type'] || '';
  const { handler } = await import(new URL(href));
  const format = contentType.startsWith('application/json')
    ? JSON.parse(body)
    : body;

  // handling of serialized FormData across Worker threads
  if (contentType.startsWith('x-greenwood/www-form-urlencoded')) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
  }

  const response = await handler(transformKoaRequestIntoStandardRequest(new URL(url), {
    method,
    header: headers,
    body: format
  }));

  parentPort.postMessage(await responseAsObject(response));
}

parentPort.on('message', async (task) => {
  await executeRouteModule(task);
});