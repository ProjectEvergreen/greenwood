import fs from 'fs/promises';
import path from 'path';
import { checkResourceExists, normalizePathnameForWindows } from '@greenwood/cli/src/lib/resource-utils.js';
import { zip } from 'zip-a-folder';

// https://docs.netlify.com/functions/create/?fn-language=js
function generateOutputFormat(id) {
  const handlerAlias = '$handler';

  return `
    import { handler as ${handlerAlias} } from './__${id}.js';

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

    await setupOutputDirectory(id, outputRoot, outputType);

    // one for the user's actual file
    await fs.cp(
      new URL(`./_${id}.js`, outputDir),
      new URL(`./_${id}.js`, outputRoot),
      { recursive: true }
    );

    // and one to act as the entry point into it (as produced by Greenwood CLI)
    await fs.cp(
      new URL(`./__${id}.js`, outputDir),
      new URL(`./__${id}.js`, outputRoot),
      { recursive: true }
    );

    // need this for URL referenced chunks
    // ideally we would map bundles to pages to avoid copying the same files into every function
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

    redirects += `${basePath}/${id}/ /.netlify/functions/${id} 200
`;
  }

  if (apiRoutes.size > 0) {
    redirects += `${basePath}/api/* /.netlify/functions/api-:splat 200`;
  }

  for (const [key] of apiRoutes) {
    const outputType = 'api';
    const id = key.replace(`${basePath}/api/`, '');
    const outputRoot = new URL(`./api/${id}/`, adapterOutputUrl);

    await setupOutputDirectory(id, outputRoot, outputType);

    await fs.cp(
      new URL(`./api/${id}.js`, outputDir),
      new URL(`./__${id}.js`, outputRoot),
      { recursive: true }
    );

    // need this for URL referenced chunks
    // ideally we would map bundles to pages to avoid copying the same files into every function
    const ssrApiAssets = (await fs.readdir(new URL('./api/', outputDir)))
      .filter(file => new RegExp(/^[\w][\w-]*\.[a-zA-Z0-9]{4,20}\.[\w]{2,4}$/).test(path.basename(file)));

    for (const asset of ssrApiAssets) {
      await fs.cp(
        new URL(`./${asset}`, new URL('./api/', outputDir)),
        new URL(`./${asset}`, outputRoot),
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