import fs from "node:fs/promises";
import path from "node:path";
import {
  checkResourceExists,
  normalizePathnameForWindows,
} from "@greenwood/cli/src/lib/resource-utils.js";
import { zip } from "zip-a-folder";

// https://docs.netlify.com/functions/create/?fn-language=js
function generateOutputFormat(id) {
  const handlerAlias = "$handler";

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
  const entryPoint = outputType === "api" ? id : `${id}.route`;
  const filename = outputType === "api" ? `api-${id}` : id;
  const outputFormat = generateOutputFormat(entryPoint);

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL(`./${filename}.js`, outputRoot), outputFormat);
  await fs.writeFile(
    new URL("./package.json", outputRoot),
    JSON.stringify({
      type: "module",
    }),
  );
}

// TODO do we need more manifest options, like node version?
// https://github.com/netlify/zip-it-and-ship-it#options
async function createOutputZip(id, outputType, outputRootUrl, projectDirectory) {
  const filename = outputType === "api" ? `api-${id}` : id;

  await zip(
    normalizePathnameForWindows(outputRootUrl),
    normalizePathnameForWindows(new URL(`./netlify/functions/${filename}.zip`, projectDirectory)),
  );
}

async function netlifyAdapter(compilation) {
  const { outputDir, projectDirectory, scratchDir } = compilation.context;
  const adapterOutputUrl = new URL("./netlify/functions/", projectDirectory);
  const adapterOutputScratchUrl = new URL("./netlify/functions/", scratchDir);
  const ssrPages = compilation.graph.filter((page) => page.isSSR);
  const apiRoutes = compilation.manifest.apis;
  // https://docs.netlify.com/routing/redirects/
  // https://docs.netlify.com/routing/redirects/rewrites-proxies/
  // When you assign an HTTP status code of 200 to a redirect rule, it becomes a rewrite.
  let redirects = "";

  if (await checkResourceExists(adapterOutputScratchUrl)) {
    await fs.rm(adapterOutputScratchUrl, { recursive: true });
  }

  if (await checkResourceExists(adapterOutputUrl)) {
    await fs.rm(adapterOutputUrl, { recursive: true });
  }

  await fs.mkdir(adapterOutputScratchUrl, { recursive: true });
  await fs.mkdir(adapterOutputUrl, { recursive: true });

  for (const page of ssrPages) {
    const { id, outputHref, route } = page;
    const outputType = "page";
    const chunks = (await fs.readdir(outputDir)).filter(
      (file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"),
    );
    const outputRoot = new URL(`./${id}/`, adapterOutputScratchUrl);

    await setupOutputDirectory(id, outputRoot, outputType);

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

    await createOutputZip(
      id,
      outputType,
      new URL(`./${id}/`, adapterOutputScratchUrl),
      projectDirectory,
    );

    redirects += `${route} /.netlify/functions/${id} 200
`;
  }

  for (const [key, value] of apiRoutes.entries()) {
    const outputType = "api";
    const { id, outputHref, route } = apiRoutes.get(key);
    const outputRoot = new URL(`./api/${id}/`, adapterOutputScratchUrl);
    const { assets = [] } = value;

    await setupOutputDirectory(id, outputRoot, outputType);

    await fs.cp(new URL(outputHref), new URL(`./${id}.js`, outputRoot), { recursive: true });

    for (const asset of assets) {
      const name = path.basename(asset);

      await fs.cp(new URL(asset), new URL(`./${name}`, outputRoot), { recursive: true });
    }

    // NOTE: All functions must live at the top level
    // https://github.com/netlify/netlify-lambda/issues/90#issuecomment-486047201
    await createOutputZip(id, outputType, outputRoot, projectDirectory);

    redirects += `${route} /.netlify/functions/api-${id} 200
`;
  }

  if (redirects !== "") {
    await fs.writeFile(new URL("./_redirects", outputDir), redirects);
  }
}

/** @type {import('./types/index.d.ts').NetlifyAdapter} */
const greenwoodPluginAdapterNetlify = () => [
  {
    type: "adapter",
    name: "plugin-adapter-netlify",
    provider: (compilation) => {
      return async () => {
        await netlifyAdapter(compilation);
      };
    },
  },
];

export { greenwoodPluginAdapterNetlify };
