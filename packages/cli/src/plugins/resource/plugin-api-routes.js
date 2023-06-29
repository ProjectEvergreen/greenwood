/*
 *
 * Manages routing to API routes.
 *
 */
import { ResourceInterface } from '../../lib/resource-interface.js';
import { Worker } from 'worker_threads';

// https://stackoverflow.com/questions/57447685/how-can-i-convert-a-request-object-into-a-stringifiable-object-in-javascript
function requestAsObject (request) {
  if (!request instanceof Request) {
    throw Object.assign(
      new Error(),
      { name: 'TypeError', message: 'Argument must be a Request object' }
    );
  }
  request = request.clone();

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
    ...stringifiableObject(request),
    headers: Object.fromEntries(request.headers),
    signal: stringifiableObject(request.signal)
    // bodyText: await request.text(), // requires function to be async
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
    const req = new Request(new URL(url), {
      ...request
    });

    // TODO does this ever run in anything but development mode?
    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      const workerUrl = new URL('../../lib/api-route-worker.js', import.meta.url);

      const response = await new Promise((resolve, reject) => {
        const worker = new Worker(workerUrl);
        const req = requestAsObject(request);

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

      return new Response(response.body, {
        ...response
      });
    } else {
      const { handler } = await import(href);

      return await handler(req);
    }
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };