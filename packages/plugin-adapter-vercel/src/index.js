import fs from 'fs/promises';
import path from 'path';
import { checkResourceExists } from '@greenwood/cli/src/lib/resource-utils.js';

// https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#node.js-helpers
function generateOutputFormat(id, type) {
  const handlerAlias = '$handler';
  const path = type === 'page'
    ? `${id}.route`
    : id;

  return `
    import { handler as ${handlerAlias} } from './${path}.js';

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
      const res = await ${handlerAlias}(req);

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
  const { basePath } = compilation.config;
  const adapterOutputUrl = new URL('./.vercel/output/functions/', projectDirectory);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl, { recursive: true });
  }

  await fs.writeFile(new URL('./.vercel/output/config.json', projectDirectory), JSON.stringify({
    'version': 3
  }));

  for (const page of ssrPages) {
    const outputType = 'page';
    const { id } = page;
    const outputRoot = new URL(`./${basePath}/${id}.func/`, adapterOutputUrl);
    const files = (await fs.readdir(outputDir))
      .filter(file => file.indexOf('.route.chunk.') > 0 && file.endsWith('.js'));

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    // handle user's actual route entry file
    await fs.cp(
      new URL(`./${id}.route.js`, outputDir),
      new URL(`./${id}.route.js`, outputRoot),
      { recursive: true }
    );

    // and the URL chunk for renderer plugin and executeRouteModule
    for (const file of files) {
      await fs.cp(
        new URL(`./${file}`, outputDir),
        new URL(`./${file}`, outputRoot),
        { recursive: true }
      );
    }
  }

  for (const [key, value] of apiRoutes.entries()) {
    const outputType = 'api';
    const id = key.replace(`${basePath}/api/`, '');
    const outputRoot = new URL(`./${basePath}/api/${id}.func/`, adapterOutputUrl);
    const { assets = [] } = value;

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    await fs.cp(
      new URL(`./api/${id}.js`, outputDir),
      new URL(`./${id}.js`, outputRoot),
      { recursive: true }
    );

    for (const asset of assets) {
      const name = path.basename(asset);

      await fs.cp(
        new URL(asset),
        new URL(`./${name}`, outputRoot),
        { recursive: true }
      );
    }
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