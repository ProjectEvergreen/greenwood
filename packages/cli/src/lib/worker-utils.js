import { workerData, parentPort } from 'worker_threads';

async function executeModule({ modulePath }) {
  const { getTemplate = null, getBody = null, getMetadata = null } = await import(modulePath).then(module => module);
  const data = {
    template: null,
    body: null,
    metadata: null
  };

  if (getTemplate) {
    data.template = await getTemplate();
  }

  if (getBody) {
    data.body = await getBody();
  }

  if (getMetadata) {
    data.metadata = await getMetadata();
  }

  parentPort.postMessage(data);
}

executeModule(workerData);