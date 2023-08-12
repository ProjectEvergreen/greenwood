import fs from 'fs/promises';
import path from 'path';
import { checkResourceExists, normalizePathnameForWindows } from '@greenwood/cli/src/lib/resource-utils.js';
import { zip } from 'zip-a-folder';

// https://docs.netlify.com/functions/create/?fn-language=js
function generateOutputFormat(id) {
  return `
    import { handler as ${id} } from './__${id}.js';

    export async function handler (event, context = {}) {
      const { rawUrl, headers, httpMethod } = event;
      const request = new Request(rawUrl, {
        method: httpMethod,
        headers: new Headers(headers)
      });
      const response = await ${id}(request, context);

      return {
        statusCode: response.status,
        body: await response.text(),
        headers: response.headers || new Headers()
      };
    }
  `;
}

async function setupOutputDirectory(id, outputRoot, outputType) {
  const outputFormat = generateOutputFormat(id, outputType);
  const filename = outputType === 'api'
    ? `api-${id}`
    : `${id}`;

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL(`./${filename}.js`, outputRoot), outputFormat);
  await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
    type: 'module'
  }));
}

// TODO manifest options, like node version?
// https://github.com/netlify/zip-it-and-ship-it#options
async function createOutputZip(id, outputType, outputRootUrl, projectDirectory) {
  const filename = outputType === 'api'
    ? `api-${id}`
    : `${id}`;

  console.log('BEFORE', { outputRootUrl, projectDirectory });
  console.log('after 1', normalizePathnameForWindows(outputRootUrl))
  console.log('after 1', normalizePathnameForWindows(new URL(`./netlify/functions/${filename}.zip`, projectDirectory)))

  await zip(
    normalizePathnameForWindows(outputRootUrl),
    normalizePathnameForWindows(new URL(`./netlify/functions/${filename}.zip`, projectDirectory))
  );
}

async function netlifyAdapter(compilation) {
  const { outputDir, projectDirectory, scratchDir } = compilation.context;
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

  const files = await fs.readdir(outputDir);
  const isExecuteRouteModule = files.find(file => file.startsWith('execute-route-module'));

  await fs.mkdir(new URL('./netlify/functions/', projectDirectory), { recursive: true });

  for (const page of ssrPages) {
    const { id } = page;
    const outputType = 'page';
    const outputRoot = new URL(`./${id}/`, adapterOutputUrl);

    await setupOutputDirectory(id, outputRoot, outputType);

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

    await createOutputZip(id, outputType, new URL(`./${id}/`, adapterOutputUrl), projectDirectory);

    redirects += `/${id}/ /.netlify/functions/${id} 200
`;
  }

  if (apiRoutes.size > 0) {
    redirects += '/api/* /.netlify/functions/api-:splat 200';
  }

  for (const [key] of apiRoutes) {
    const outputType = 'api';
    const id = key.replace('/api/', '');
    const outputRoot = new URL(`./api/${id}/`, adapterOutputUrl);

    await setupOutputDirectory(id, outputRoot, outputType);

    // TODO ideally all functions would be self contained
    // https://github.com/ProjectEvergreen/greenwood/issues/1118
    await fs.cp(
      new URL(`./api/${id}.js`, outputDir),
      new URL(`./__${id}.js`, outputRoot),
      { recursive: true }
    );

    if (await checkResourceExists(new URL('./api/assets/', outputDir))) {
      await fs.cp(
        new URL('./api/assets/', outputDir),
        new URL('./assets/', outputRoot),
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