// https://vercel.com/docs/build-output-api/v3/
// https://github.com/vercel/examples/tree/main/build-output-api/serverless-functions
import fs from 'fs/promises';
import { checkResourceExists } from '@greenwood/cli/src/lib/resource-utils.js';

function generateOutputFormat(id, type) {
  const path = type === 'page'
    ? `__${id}`
    : id;

  // TODO need to handle all Response properties like headers
  // https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-request-and-response-objects
  return `
    import { handler as ${id} } from './${path}.js';

    export default async function handler (request, response) {
      const { url, headers } = request;
      const req = new Request(new URL(url, \`http://\${headers.host}\`), {
        headers: new Headers(headers)
      });
      const res = await ${id}(req);

      response.status(res.status);
      response.send(await res.text());
    }
  `;
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
    const { id } = page;
    const outputFormat = generateOutputFormat(id, 'page');
    const outputRoot = new URL(`./${id}.func/`, adapterOutputUrl);

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
  }

  for (const [key] of apiRoutes) {
    const id = key.replace('/api/', '');
    const outputFormat = generateOutputFormat(id, 'api');
    const outputRoot = new URL(`./api/${id}.func/`, adapterOutputUrl);

    await fs.mkdir(outputRoot, { recursive: true });
    await fs.writeFile(new URL('./index.js', outputRoot), outputFormat);
    await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
      type: 'module'
    }));
    // https://vercel.com/docs/build-output-api/v3/primitives#config-example
    await fs.writeFile(new URL('./.vc-config.json', outputRoot), JSON.stringify({
      runtime: 'nodejs18.x',
      handler: 'index.js',
      launcherType: 'Nodejs',
      shouldAddHelpers: true
    }));

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