import { pathToFileURL } from 'url';
import { workerData, parentPort } from 'worker_threads';

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
    data.body = await getBody(parsedCompilation, route);
  }

  if (getFrontmatter) {
    data.frontmatter = await getFrontmatter(parsedCompilation, route, label, id);
  }

  parentPort.postMessage(data);
}

executeRouteModule(workerData);