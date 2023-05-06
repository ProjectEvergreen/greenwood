// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';

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

  // TODO handle full response
  // https://github.com/ProjectEvergreen/greenwood/issues/1048
  return {
    ...stringifiableObject(response),
    headers: Object.fromEntries(response.headers),
    // signal: stringifiableObject(request.signal),
    body: await response.text()
  };
}

async function executeRouteModule({ href, request }) {
  const { handler } = await import(href);
  const response = await handler(request);

  parentPort.postMessage(await responseAsObject(response));
}

parentPort.on('message', async (task) => {
  await executeRouteModule(task);
});