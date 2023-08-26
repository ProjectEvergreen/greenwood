import fs from 'fs/promises';
import path from 'path';
import { checkResourceExists } from '@greenwood/cli/src/lib/resource-utils.js';

// https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#node.js-helpers
function generateOutputFormat(id, type) {
  const variableNameSafeId = id.replace(/-/g, '');
  const path = type === 'page'
    ? `__${id}`
    : id;

  return `
    import { handler as ${variableNameSafeId} } from './${path}.js';

    export default async function handler (request, response) {
      const { body, url, headers = {}, method } = request;
      const contentType = headers['content-type'] || '';
      let format = body;

      if (['GET', 'HEAD'].includes(method.toUpperCase())) {
        format = null
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = new FormData();

        for (const key of Object.keys(body)) {
          formData.append(key, body[key]);
        }

        // when using FormData, let Request set the correct headers
        // or else it will come out as multipart/form-data
        // https://stackoverflow.com/a/43521052/417806
        format = formData;
        delete headers['content-type'];
      } else if(contentType.includes('application/json')) {
        format = JSON.stringify(body);
      }

      const req = new Request(new URL(url, \`http://\${headers.host}\`), {
        body: format,
        headers: new Headers(headers),
        method
      });
      const res = await ${variableNameSafeId}(req);

      res.headers.forEach((value, key) => {
        response.setHeader(key, value);
      });
      response.status(res.status);
      response.send(await res.text());
    }
  `;
}

async function setupFunctionBuildFolder(id, outputType, outputRoot) {
  const outputFormat = generateOutputFormat(id, outputType);

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL('./index.js', outputRoot), outputFormat);
  await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
    type: 'module'
  }));
  await fs.writeFile(new URL('./.vc-config.json', outputRoot), JSON.stringify({
    runtime: 'nodejs18.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    shouldAddHelpers: true
  }));
}

async function vercelAdapter(compilation) {
  const { outputDir, projectDirectory } = compilation.context;
  const adapterOutputUrl = new URL('./.vercel/output/functions/', projectDirectory);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl, { recursive: true });
  }

  await fs.writeFile(new URL('./.vercel/output/config.json', projectDirectory), JSON.stringify({
    'version': 3
  }));

  const files = await fs.readdir(outputDir);
  const isExecuteRouteModule = files.find(file => file.startsWith('execute-route-module'));

  for (const page of ssrPages) {
    const outputType = 'page';
    const { id } = page;
    const outputRoot = new URL(`./${id}.func/`, adapterOutputUrl);

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    await fs.cp(
      new URL(`./_${id}.js`, outputDir),
      new URL(`./_${id}.js`, outputRoot),
      { recursive: true }
    );

    await fs.cp(
      new URL(`./__${id}.js`, outputDir),
      new URL(`./__${id}.js`, outputRoot),
      { recursive: true }
    );

    // TODO quick hack to make serverless pages are fully self-contained
    // for example, execute-route-module.js will only get code split if there are more than one SSR pages
    // https://github.com/ProjectEvergreen/greenwood/issues/1118
    if (isExecuteRouteModule) {
      await fs.cp(
        new URL(`./${isExecuteRouteModule}`, outputDir),
        new URL(`./${isExecuteRouteModule}`, outputRoot)
      );
    }

    // TODO how to track SSR resources that get dumped out in the public directory?
    // https://github.com/ProjectEvergreen/greenwood/issues/1118
    const ssrPageAssets = (await fs.readdir(outputDir))
      .filter(file => !path.basename(file).startsWith('_')
        && !path.basename(file).startsWith('execute')
        && path.basename(file).endsWith('.js')
      );

    for (const asset of ssrPageAssets) {
      await fs.cp(
        new URL(`./${asset}`, outputDir),
        new URL(`./${asset}`, outputRoot),
        { recursive: true }
      );
    }
  }

  for (const [key] of apiRoutes) {
    const outputType = 'api';
    const id = key.replace('/api/', '');
    const outputRoot = new URL(`./api/${id}.func/`, adapterOutputUrl);

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    // TODO ideally all functions would be self contained
    // https://github.com/ProjectEvergreen/greenwood/issues/1118
    await fs.cp(
      new URL(`./api/${id}.js`, outputDir),
      new URL(`./${id}.js`, outputRoot),
      { recursive: true }
    );
    await fs.cp(
      new URL('./api/assets/', outputDir),
      new URL('./assets/', outputRoot),
      { recursive: true }
    );
  }

  // static assets / build
  await fs.cp(
    outputDir,
    new URL('./.vercel/output/static/', projectDirectory),
    {
      recursive: true
    }
  );
}

const greenwoodPluginAdapterVercel = (options = {}) => [{
  type: 'adapter',
  name: 'plugin-adapter-vercel',
  provider: (compilation) => {
    return async () => {
      await vercelAdapter(compilation, options);
    };
  }
}];

export { greenwoodPluginAdapterVercel };