// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { pathToFileURL } from 'url';
import { workerData, parentPort } from 'worker_threads';
import { renderToString } from 'wc-compiler';

async function executeRouteModule({ modulePath, compilation, route, label, id }) {
  const module = await import(pathToFileURL(modulePath)).then(module => module);
  const { getFrontmatter = null, getBody = null, getTemplate = null } = module;
  const parsedCompilation = JSON.parse(compilation);
  const data = {
    template: null,
    body: null,
    frontmatter: null
  };

  if (getFrontmatter) {
    data.frontmatter = await getFrontmatter(parsedCompilation, route, label, id);
  }

  if (getTemplate) {
    data.template = await getTemplate(parsedCompilation, route);
  }

  if (module.default) {
    console.debug('exporting a native custom element', modulePath);
    const { html, metadata } = await renderToString(new URL(modulePath, import.meta.url));
    console.debug({ metadata });

    data.body = html;
  } else {
    if (getBody) {
      data.body = await getBody(parsedCompilation, route);
    }
  }

  parentPort.postMessage(data);
}

executeRouteModule(workerData);