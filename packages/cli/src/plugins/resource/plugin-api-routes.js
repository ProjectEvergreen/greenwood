/*
 *
 * Manages routing to API routes.
 *
 */
import { ResourceInterface } from '../../lib/resource-interface.js';
import { Worker } from 'worker_threads';

// https://stackoverflow.com/questions/57447685/how-can-i-convert-a-request-object-into-a-stringifiable-object-in-javascript
async function requestAsObject (_request) {
  if (!_request instanceof Request) {
    throw Object.assign(
      new Error(),
      { name: 'TypeError', message: 'Argument must be a Request object' }
    );
  }

  const request = _request.clone();
  const contentType = request.headers.get('content-type') || '';
  let headers = Object.fromEntries(request.headers);
  let format;

  function stringifiableObject (obj) {
    const filtered = {};
    for (const key in obj) {
      if (['boolean', 'number', 'string'].includes(typeof obj[key]) || obj[key] === null) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const params = {};

    for (const entry of formData.entries()) {
      params[entry[0]] = entry[1];
    }

    // when using FormData, let Request set the correct headers
    // or else it will come out as multipart/form-data
    // for serialization between route workers, leave a special marker for Greenwood
    // https://stackoverflow.com/a/43521052/417806
    headers['content-type'] = 'x-greenwood/www-form-urlencoded';
    format = JSON.stringify(params);
  } else if (contentType.includes('application/json')) {
    format = JSON.stringify(await request.json());
  } else {
    format = await request.text();
  }

  return {
    ...stringifiableObject(request),
    body: format,
    headers
  };
}

class ApiRoutesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;

    return protocol.startsWith('http') && this.compilation.manifest.apis.has(pathname);
  }

  async serve(url, request) {
    const api = this.compilation.manifest.apis.get(url.pathname);
    const apiUrl = new URL(`.${api.path}`, this.compilation.context.userWorkspace);
    const href = apiUrl.href;

    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      const workerUrl = new URL('../../lib/api-route-worker.js', import.meta.url);
      const req = await requestAsObject(request);

      const response = await new Promise(async (resolve, reject) => {
        const worker = new Worker(workerUrl);

        worker.on('message', (result) => {
          resolve(result);
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        worker.postMessage({ href, request: req });
      });
      const { headers, body, status, statusText } = response;

      return new Response(status === 204 ? null : body, {
        headers: new Headers(headers),
        status,
        statusText
      });
    } else {
      const { handler } = await import(href);

      return await handler(request);
    }
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };