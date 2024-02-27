// this needs to come first
import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import { Buffer } from 'buffer';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Readable } from 'stream';

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

async function executeRouteModule({ moduleUrl, compilation, page, prerender, htmlContents, scripts }) {
  const data = {
    template: null,
    body: null,
    frontmatter: null,
    html: null
  };

  // prerender static content
  if (prerender) {
    for (const script of scripts) {
      await import(script);
    }

    const templateResult = html`${unsafeHTML(htmlContents)}`;

    data.html = await getTemplateResultString(templateResult);
  } else {
    const module = await import(moduleUrl).then(module => module);
    const { getTemplate = null, getBody = null, getFrontmatter = null, isolation } = module;

    // TODO cant we get these from just pulling from the file during the graph phase?
    if (isolation) {
      data.isolation = true;
    }

    if (module.default && module.tagName) {
      const { tagName } = module;
      const templateResult = html`
        ${unsafeHTML(`<${tagName}></${tagName}>`)}
      `;

      data.body = await getTemplateResultString(templateResult);
    } else if (getBody) {
      const templateResult = await getBody(compilation, page);

      data.body = await getTemplateResultString(templateResult);
    }

    if (getTemplate) {
      const templateResult = await getTemplate(compilation, page);

      data.template = await getTemplateResultString(templateResult);
    }

    if (getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }
  }

  return data;
}

export { executeRouteModule };