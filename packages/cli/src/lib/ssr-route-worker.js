import { workerData, parentPort } from 'worker_threads';

async function executeRouteModule({ modulePath, compilation }) {
  const { getTemplate = null, getBody = null, getMetadata = null } = await import(modulePath).then(module => module);
  const parsedCompilation = JSON.parse(compilation);
  const data = {
    template: null,
    body: null,
    metadata: null
  };

  if (getTemplate) {
    data.template = await getTemplate(parsedCompilation);
  }

  if (getBody) {
    data.body = await getBody(parsedCompilation);
  }

  if (getMetadata) {
    data.metadata = await getMetadata(parsedCompilation);
  }

  parentPort.postMessage(data);
}

executeRouteModule(workerData);