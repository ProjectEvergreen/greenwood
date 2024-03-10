import fs from 'fs/promises';
import path from 'path';
import { checkResourceExists, normalizePathnameForWindows } from '@greenwood/cli/src/lib/resource-utils.js';
import { zip } from 'zip-a-folder';

// https://docs.netlify.com/functions/create/?fn-language=js
function generateOutputFormat(id) {
  const handlerAlias = '$handler';

  return `
    import { handler as ${handlerAlias} } from './${id}.js';

    export async function handler (event, context = {}) {
      const { rawUrl, body, headers = {}, httpMethod } = event;
      const contentType = headers['content-type'] || '';
      let format = body;

      if (['GET', 'HEAD'].includes(httpMethod.toUpperCase())) {
        format = null
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const searchParams = new URLSearchParams(body);
        const formData = new FormData();

        for (const key of searchParams.keys()) {
          const value = searchParams.get(key);
          formData.append(key, value);
        }

        // when using FormData, let Request set the correct headers
        // or else it will come out as multipart/form-data
        // https://stackoverflow.com/a/43521052/417806
        format = formData;
        delete headers['content-type'];
      } else if(contentType.includes('application/json')) {
        format = JSON.stringify(body);
      }

      const request = new Request(rawUrl, {
        body: format,
        method: httpMethod,
        headers: new Headers(headers)
      });
      const response = await ${handlerAlias}(request, context);

      return {
        statusCode: response.status,
        body: await response.text(),
        headers: response.headers || new Headers()
      };
    }
  `;
}

async function setupOutputDirectory(id, outputRoot, outputType) {
  const entryPoint = outputType === 'api' ? id : `${id}.route`;
  const filename = outputType === 'api' ? `api-${id}` : id;
  const outputFormat = generateOutputFormat(entryPoint, outputType);

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL(`./${filename}.js`, outputRoot), outputFormat);
  await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
    type: 'module'
  }));
}

// TODO do we need more manifest options, like node version?
// https://github.com/netlify/zip-it-and-ship-it#options
async function createOutputZip(id, outputType, outputRootUrl, projectDirectory) {
  const filename = outputType === 'api'
    ? `api-${id}`
    : `${id}`;

  await zip(
    normalizePathnameForWindows(outputRootUrl),
    normalizePathnameForWindows(new URL(`./netlify/functions/${filename}.zip`, projectDirectory))
  );
}

async function netlifyAdapter(compilation) {
  const { outputDir, projectDirectory, scratchDir } = compilation.context;
  const { basePath } = compilation.config;
  const adapterOutputUrl = new URL('./netlify/functions/', scratchDir);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;
  // https://docs.netlify.com/routing/redirects/
  // https://docs.netlify.com/routing/redirects/rewrites-proxies/
  // When you assign an HTTP status code of 200 to a redirect rule, it becomes a rewrite.
  let redirects = '';

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl, { recursive: true });
  }

  await fs.mkdir(new URL('./netlify/functions/', projectDirectory), { recursive: true });

  for (const page of ssrPages) {
    const { id } = page;
    const outputType = 'page';
    const outputRoot = new URL(`./${id}/`, adapterOutputUrl);
    const files = (await fs.readdir(outputDir))
      .filter(file => file.startsWith(`${id}.route.chunk.`) && file.endsWith('.js'));

    await setupOutputDirectory(id, outputRoot, outputType);

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

    await createOutputZip(id, outputType, new URL(`./${id}/`, adapterOutputUrl), projectDirectory);

    redirects += `${basePath}/${id}/ /.netlify/functions/${id} 200
`;
  }

  if (apiRoutes.size > 0) {
    redirects += `${basePath}/api/* /.netlify/functions/api-:splat 200`;
  }

  for (const [key, value] of apiRoutes.entries()) {
    const outputType = 'api';
    const id = key.replace(`${basePath}/api/`, '');
    const outputRoot = new URL(`./api/${id}/`, adapterOutputUrl);
    const { assets = [] } = value;
    await setupOutputDirectory(id, outputRoot, outputType);

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

    // NOTE: All functions must live at the top level
    // https://github.com/netlify/netlify-lambda/issues/90#issuecomment-486047201
    await createOutputZip(id, outputType, outputRoot, projectDirectory);
  }

  if (redirects !== '') {
    await fs.writeFile(new URL('./_redirects', outputDir), redirects);
  }
}

const greenwoodPluginAdapterNetlify = (options = {}) => [{
  type: 'adapter',
  name: 'plugin-adapter-netlify',
  provider: (compilation) => {
    return async () => {
      await netlifyAdapter(compilation, options);
    };
  }
}];

export { greenwoodPluginAdapterNetlify };