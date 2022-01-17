import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import { Buffer } from 'buffer';
import { pathToFileURL } from 'url';
import { Readable } from 'stream';
import { workerData, parentPort } from 'worker_threads';

async function streamToString (stream) {
  const chunks = [];

  for await (let chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

async function executeRouteModule({ modulePath, compilation, route, label, id }) {
  const { getTemplate = null, getBody = null, getFrontmatter = null } = await import(pathToFileURL(modulePath)).then(module => module);
  const parsedCompilation = JSON.parse(compilation);
  const data = {
    template: null,
    body: null,
    frontmatter: null
  };

  if (getTemplate) {
    data.template = await getTemplate(parsedCompilation, route);
  }

  if (getBody) {
    const result = await getBody(parsedCompilation, route);
    const resultString = await streamToString(Readable.from(render(result)));

    data.body = resultString;
  }

  if (getFrontmatter) {
    data.frontmatter = await getFrontmatter(parsedCompilation, route, label, id);
  }

  parentPort.postMessage(data);
}

executeRouteModule(workerData);