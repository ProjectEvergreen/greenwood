// https://docs.netlify.com/functions/deploy/?fn-language=js#custom-build-2
import fs from 'fs/promises';
import { checkResourceExists } from '@greenwood/cli/src/lib/resource-utils.js';
import { zip } from 'zip-a-folder';

function generateOutputFormat(id) {
  // TODO use `new Headers` here?
  return `
    import { handler as ${id} } from './__${id}.js';

    export async function handler (event, context) {
      const { rawUrl, headers } = event;
      const request = new Request(rawUrl, { headers });
      const response = await ${id}(request);

      // TODO need to handle all Response properties like headers
      return {
        statusCode: response.status,
        body: await response.text()
      };
    }
  `;
}

async function netlifyAdapter(compilation) {
  const { outputDir, projectDirectory, scratchDir } = compilation.context;
  const adapterOutputUrl = new URL('./netlify/functions/', scratchDir);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl, { recursive: true });
  }

  const files = await fs.readdir(outputDir);
  const isExecuteRouteModule = files.find(file => file.startsWith('execute-route-module'));
  await fs.mkdir(new URL('./netlify/functions/', projectDirectory), { recursive: true });

  for (const page of ssrPages) {
    const { id } = page;
    const outputFormat = generateOutputFormat(id, 'page');
    const outputRoot = new URL(`./${id}/`, adapterOutputUrl);

    await fs.mkdir(outputRoot, { recursive: true });
    await fs.writeFile(new URL(`./${id}.js`, outputRoot), outputFormat);
    await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
      type: 'module'
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

    // TODO manifest options, like node version?
    // https://github.com/netlify/zip-it-and-ship-it#options
    await zip(
      new URL(`./${id}/`, adapterOutputUrl).pathname,
      new URL(`./netlify/functions/${id}.zip`, projectDirectory).pathname
    );
  }

  // public/api/
  for (const [key] of apiRoutes) {
    const id = key.replace('/api/', '');
    const outputFormat = generateOutputFormat(id, 'api');
    const outputRoot = new URL(`./api/${id}/`, adapterOutputUrl);

    await fs.mkdir(outputRoot, { recursive: true });
    await fs.writeFile(new URL(`./api-${id}.js`, outputRoot), outputFormat);
    await fs.writeFile(new URL('./package.json', outputRoot), JSON.stringify({
      type: 'module'
    }));

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
    // # https://github.com/netlify/netlify-lambda/issues/90#issuecomment-486047201
    await zip(
      outputRoot.pathname,
      new URL(`./netlify/functions/api-${id}.zip`, projectDirectory).pathname
    );
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