import fs from "node:fs/promises";
import path from "node:path";
import { checkResourceExists } from "@greenwood/cli/src/lib/resource-utils.js";

const DEFAULT_RUNTIME = "nodejs20.x";

// https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#node.js-helpers
function generateOutputFormat(id, type) {
  const handlerAlias = "$handler";
  const path = type === "page" ? `${id}.route` : id;

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

async function setupFunctionBuildFolder(id, outputType, outputRoot, runtime) {
  const outputFormat = generateOutputFormat(id, outputType);

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL("./index.js", outputRoot), outputFormat);
  await fs.writeFile(
    new URL("./package.json", outputRoot),
    JSON.stringify({
      type: "module",
    }),
  );
  await fs.writeFile(
    new URL("./.vc-config.json", outputRoot),
    JSON.stringify({
      runtime,
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    }),
  );
}

async function vercelAdapter(compilation, options) {
  const { runtime = DEFAULT_RUNTIME } = options;
  const { outputDir, projectDirectory } = compilation.context;
  const adapterOutputUrl = new URL("./.vercel/output/functions/", projectDirectory);
  const ssrPages = compilation.graph.filter((page) => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (await checkResourceExists(adapterOutputUrl)) {
    await fs.rm(adapterOutputUrl, { recursive: true });
  }

  await fs.mkdir(adapterOutputUrl, { recursive: true });
  await fs.writeFile(
    new URL("./.vercel/output/config.json", projectDirectory),
    JSON.stringify({
      version: 3,
    }),
  );

  for (const page of ssrPages) {
    const outputType = "page";
    const { id, outputHref, route } = page;
    // chop off the last / in route, and just use the id if the index route
    const name = id === "index" ? id : `.${route.slice(0, -1)}`;
    const outputRoot = new URL(`${name}.func/`, adapterOutputUrl);
    const chunks = (await fs.readdir(outputDir)).filter(
      (file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"),
    );

    await setupFunctionBuildFolder(id, outputType, outputRoot, runtime);

    // handle user's actual route entry file
    await fs.cp(
      new URL(outputHref),
      new URL(`./${outputHref.replace(outputDir.href, "")}`, outputRoot),
      { recursive: true },
    );

    // and any (URL) chunks for the page
    for (const chunk of chunks) {
      await fs.cp(new URL(`./${chunk}`, outputDir), new URL(`./${chunk}`, outputRoot), {
        recursive: true,
      });
    }
  }

  for (const [key, value] of apiRoutes.entries()) {
    const outputType = "api";
    const { id, outputHref, route } = apiRoutes.get(key);
    const outputRoot = new URL(`.${route}.func/`, adapterOutputUrl);
    const { assets = [] } = value;

    await setupFunctionBuildFolder(id, outputType, outputRoot, runtime);

    await fs.cp(new URL(outputHref), new URL(`./${id}.js`, outputRoot), { recursive: true });

    for (const asset of assets) {
      const name = path.basename(asset);

      await fs.cp(new URL(asset), new URL(`./${name}`, outputRoot), { recursive: true });
    }
  }

  // static assets / build
  await fs.cp(outputDir, new URL("./.vercel/output/static/", projectDirectory), {
    recursive: true,
  });
}

/** @type {import('./types/index.d.ts').VercelAdapter} */
const greenwoodPluginAdapterVercel = (options = {}) => [
  {
    type: "adapter",
    name: "plugin-adapter-vercel",
    provider: (compilation) => {
      return async () => {
        await vercelAdapter(compilation, options);
      };
    },
  },
];

export { greenwoodPluginAdapterVercel };
