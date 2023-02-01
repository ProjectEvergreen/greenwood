// https://github.com/nodejs/modules/issues/307#issuecomment-858729422
import { parentPort } from 'worker_threads';
import { renderToString, renderFromHTML } from 'wc-compiler';

async function executeRouteModule({ moduleUrl, compilation, route, label, id, prerender, htmlContents, scripts }) {
  const parsedCompilation = JSON.parse(compilation);
  const data = {
    template: null,
    body: null,
    frontmatter: null,
    html: null
  };

  if (prerender) {
    const scriptURLs = JSON.parse(scripts).map(scriptFile => new URL(scriptFile));
    const { html } = await renderFromHTML(htmlContents, scriptURLs);

    data.html = html;
  } else {
    const module = await import(moduleUrl).then(module => module);
    const { getTemplate = null, getBody = null, getFrontmatter = null } = module;

    if (module.default) {
      const { html } = await renderToString(new URL(moduleUrl));

      data.body = html;
    } else {
      if (getBody) {
        data.body = await getBody(parsedCompilation, route);
      }
    }

    if (getTemplate) {
      data.template = await getTemplate(parsedCompilation, route);
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