import fs from "node:fs/promises";
import { getDynamicPages } from "@greenwood/cli/src/lib/graph-utils.js";

const ADAPTER_OUTPUT_DIR = ".deno-deploy";

function generateServer(compilation, serveStatic) {
  const { outputDir } = compilation.context;
  const { basePath } = compilation.config;
  const dynamicPages = getDynamicPages(compilation);
  const imports = [];
  const routes = [];

  const addRoute = ({ id, outputHref, route, segment }, type, index) => {
    const handlerAlias = `$handler${index}`;
    const outputPath = type === "api" ? `api/${id}.js` : outputHref.replace(outputDir.href, "");
    const pathname = segment ? `${basePath}${segment.pathname}` : route;

    imports.push(`import { handler as ${handlerAlias} } from "../public/${outputPath}";`);
    routes.push(
      `  { pattern: new URLPattern({ pathname: ${JSON.stringify(pathname)} }), handler: ${handlerAlias}, type: "${type}", hasParams: ${Boolean(segment)} },`,
    );
  };

  dynamicPages.forEach((page, index) => addRoute(page, "page", index));

  [...compilation.manifest.apis.values()].forEach((api, index) => {
    addRoute(api, "api", dynamicPages.length + index);
  });

  const staticImport = serveStatic
    ? 'import { serveDir } from "jsr:@std/http@1.1.3/file-server";'
    : "";
  const fallback = serveStatic
    ? `return serveDir(request, {
    fsRoot: "./public",
    urlRoot: ${JSON.stringify(basePath.replace(/^\//, ""))},
    quiet: true,
    showDirListing: false,
  });`
    : 'return new Response("Not found", { status: 404 });';

  return `${imports.join("\n")}
${staticImport}

const routes = [
${routes.join("\n")}
];

Deno.serve(async (request) => {
  const url = new URL(request.url);

  for (const { pattern, handler, type, hasParams } of routes) {
    const match = pattern.exec(url);

    if (match) {
      const params = hasParams ? match.pathname.groups : undefined;

      return type === "page"
        ? await handler(request, params)
        : await handler(request, { params });
    }
  }

  if (url.pathname.startsWith(${JSON.stringify(`${basePath}/api/`)})) {
    return Response.json({ error: "API route not found" }, { status: 404 });
  }

  ${fallback}
});
`;
}

async function denoDeployAdapter(compilation, options) {
  const { serveStatic = true } = options;
  const { projectDirectory } = compilation.context;
  const adapterOutputUrl = new URL(`./${ADAPTER_OUTPUT_DIR}/`, projectDirectory);

  await fs.rm(adapterOutputUrl, { recursive: true, force: true });
  await fs.mkdir(adapterOutputUrl, { recursive: true });
  await fs.writeFile(
    new URL("./server.js", adapterOutputUrl),
    generateServer(compilation, serveStatic),
  );
}

/** @type {import('./types/index.d.ts').DenoDeployAdapter} */
const greenwoodPluginAdapterDenoDeploy = (options = {}) => [
  {
    type: "adapter",
    name: "plugin-adapter-deno-deploy",
    provider: (compilation) => {
      return async () => {
        await denoDeployAdapter(compilation, options);
      };
    },
  },
];

export { greenwoodPluginAdapterDenoDeploy };
