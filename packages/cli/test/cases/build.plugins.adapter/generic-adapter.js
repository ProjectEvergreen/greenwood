import fs from 'fs/promises';
import { checkResourceExists } from '../../../../cli/src/lib/resource-utils.js';

function generateOutputFormat(id, type) {
  const path = type === 'page'
    ? `${id}.route`
    : `api/${id}`;
  const ref = id.replace(/-/g, '');

  return `
    import { handler as ${ref} } from '../public/${path}.js';

    export async function handler (request) {
      const { url, headers } = request;
      const req = new Request(new URL(url, \`http://\${headers.host}\`), {
        headers: new Headers(headers)
      });

      return await ${ref}(req);
    }
  `;
}

async function genericAdapter(compilation) {
  const adapterOutputUrl = new URL('./adapter-output/', compilation.context.projectDirectory);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl);
  }

  for (const page of ssrPages) {
    const { outputPath } = page;
    const id = outputPath.replace('.route.js', '');
    const outputFormat = generateOutputFormat(id, 'page');

    await fs.writeFile(new URL(`./${id}.js`, adapterOutputUrl), outputFormat);
  }

  // public/api/
  for (const [key] of apiRoutes) {
    const id = key.replace('/api/', '');
    const outputFormat = generateOutputFormat(id, 'api');

    await fs.writeFile(new URL(`./${id}.js`, adapterOutputUrl), outputFormat);
  }
}

const greenwoodPluginAdapterGeneric = (options = {}) => [{
  type: 'adapter',
  name: 'plugin-adapter-generic',
  provider: (compilation) => {
    return async () => {
      await genericAdapter(compilation, options);
    };
  }
}];

export { greenwoodPluginAdapterGeneric };