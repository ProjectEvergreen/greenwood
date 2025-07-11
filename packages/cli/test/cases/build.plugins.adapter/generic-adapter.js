import fs from "node:fs/promises";
import path from "node:path";
import { checkResourceExists } from "../../../../cli/src/lib/resource-utils.js";

function generateOutputFormat(id, type) {
  const path = type === "page" ? `/${id}.route` : `/api/${id}`;
  const ref = id.replace(/-/g, "").replace(/\//g, "");

  return `
    import { handler as ${ref} } from '../public${path}.js';

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
  const { outputDir } = compilation.context;
  const adapterOutputUrl = new URL("./adapter-output/", compilation.context.projectDirectory);
  const ssrPages = compilation.graph.filter((page) => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!(await checkResourceExists(adapterOutputUrl))) {
    await fs.mkdir(adapterOutputUrl);
  }

  for (const page of ssrPages) {
    const { id } = page;
    const outputFormat = generateOutputFormat(id, "page");
    const chunks = (await fs.readdir(outputDir)).filter(
      (file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"),
    );

    await fs.writeFile(new URL(`./${id}.js`, adapterOutputUrl), outputFormat);

    for (const chunk of chunks) {
      await fs.cp(new URL(`./${chunk}`, outputDir), new URL(`./${chunk}`, adapterOutputUrl), {
        recursive: true,
      });
    }
  }

  for (const [key] of apiRoutes) {
    const { id, assets } = apiRoutes.get(key);
    const outputFormat = generateOutputFormat(id, "api");

    await fs.writeFile(new URL(`./api-${id}.js`, adapterOutputUrl), outputFormat);

    for (const asset of assets) {
      const name = path.basename(asset);

      await fs.cp(new URL(`./api/${name}`, outputDir), new URL(`./${name}`, adapterOutputUrl), {
        recursive: true,
      });
    }
  }
}

const greenwoodPluginAdapterGeneric = (options = {}) => [
  {
    type: "adapter",
    name: "plugin-adapter-generic",
    provider: (compilation) => {
      return async () => {
        await genericAdapter(compilation, options);
      };
    },
  },
];

export { greenwoodPluginAdapterGeneric };
