// this needs to come first
import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import { Buffer } from 'buffer';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Readable } from 'stream';
import { parentPort } from 'worker_threads';

async function streamToString (stream) {
  const chunks = [];

  for await (let chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

async function getTemplateResultString(template) {
  return await streamToString(Readable.from(render(template)));
}

async function executeRouteModule({ moduleUrl, compilation, route, label, id, prerender, htmlContents, scripts }) {
  const parsedCompilation = JSON.parse(compilation);
  const parsedScripts = scripts ? JSON.parse(scripts) : [];
  const data = {
    template: null,
    body: null,
    frontmatter: null,
    html: null
  };

  // prerender static content
  if (prerender) {
    for (const script of parsedScripts) {
      await import(script);
    }

    const templateResult = html`${unsafeHTML(htmlContents)}`;

    data.html = await getTemplateResultString(templateResult);
  } else {
    const module = await import(moduleUrl).then(module => module);
    const { getTemplate = null, getBody = null, getFrontmatter = null } = module;

    if (module.default && module.tagName) {
      const { tagName } = module;
      const templateResult = html`
        ${unsafeHTML(`<${tagName}></${tagName}>`)}
      `;

      data.body = await getTemplateResultString(templateResult);
    } else if (getBody) {
      const templateResult = await getBody(parsedCompilation, route);

      data.body = await getTemplateResultString(templateResult);
    }

    if (getTemplate) {
      const templateResult = await getTemplate(parsedCompilation, route);

      data.template = await getTemplateResultString(templateResult);
    }

    if (getFrontmatter) {
      data.frontmatter = await getFrontmatter(parsedCompilation, route, label, id);
    }
  }

  parentPort.postMessage(data);
}

parentPort.on('message', async (task) => {
  await executeRouteModule(task);
});