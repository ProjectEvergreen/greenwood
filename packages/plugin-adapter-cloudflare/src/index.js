import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDynamicPages } from "@greenwood/cli/src/lib/graph-utils.js";

function generateWorker(routes, basePath) {
  const entries = routes.map(
    ({ pathname, specifier, type }) => `  {
    pattern: new URLPattern({ pathname: ${JSON.stringify(pathname)} }),
    load: () => import(${JSON.stringify(specifier)}),
    type: ${JSON.stringify(type)},
  },`,
  );

  return `const routes = [
${entries.join("\n")}
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1) || '/'
      : url.pathname;

    for (const route of routes) {
      const match = route.pattern.exec({ pathname });

      if (match) {
        const { handler } = await route.load();
        const params = match.pathname.groups;

        return route.type === 'page'
          ? handler(request, params)
          : handler(request, { params });
      }
    }

    const apiPrefix = ${JSON.stringify(`${basePath}/api`)};

    if (pathname === apiPrefix || pathname.startsWith(apiPrefix + '/')) {
      return new Response('Not Found', { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
`;
}

function compareRoutes(left, right) {
  const leftSegments = left.route.split("/");
  const rightSegments = right.route.split("/");

  for (let index = 0; index < Math.min(leftSegments.length, rightSegments.length); index++) {
    const leftDynamic = leftSegments[index].startsWith("[");
    const rightDynamic = rightSegments[index].startsWith("[");

    if (leftDynamic !== rightDynamic) {
      return leftDynamic ? 1 : -1;
    }
  }

  return rightSegments.length - leftSegments.length;
}

async function cloudflareAdapter(compilation) {
  const { outputDir, projectDirectory } = compilation.context;
  const functionsDir = new URL("./functions/", projectDirectory);
  const pages = getDynamicPages(compilation);
  const apis = [...compilation.manifest.apis.values()];
  const outputFiles = await fs.readdir(outputDir);
  const routes = [];
  const serverFiles = new Set();
  const basePath = compilation.config.basePath || "";

  // The functions directory contains generated output. Remove stale routes and chunks.
  await fs.rm(functionsDir, { recursive: true, force: true });
  await fs.mkdir(functionsDir, { recursive: true });

  async function copyServerFile(href, sourceDir, functionDir) {
    const source = new URL(href);
    const relativePath = path.relative(fileURLToPath(sourceDir), fileURLToPath(source));

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(
        `Cloudflare adapter asset is outside its route bundle directory: ${source.href}`,
      );
    }

    const destination = new URL(relativePath.split(path.sep).join("/"), functionDir);

    await fs.mkdir(new URL("./", destination), { recursive: true });
    await fs.copyFile(source, destination);
    serverFiles.add(
      path.relative(fileURLToPath(outputDir), fileURLToPath(source)).split(path.sep).join("/"),
    );

    return destination;
  }

  async function copyFunction(entry, type) {
    const { id, outputHref, route, assets = [] } = entry;
    const routePath = route.replace(/^\/+|\/+$/g, "");
    const functionDir = new URL(`./${routePath ? `${routePath}/` : ""}`, functionsDir);
    // API manifest outputHref can retain its source route path with a basePath.
    // Greenwood emits API entry modules using their normalized route IDs.
    const sourceHref = type === "api" ? new URL(`./api/${id}.js`, outputDir).href : outputHref;
    const sourceDir = new URL("./", sourceHref);
    const moduleUrl = await copyServerFile(sourceHref, sourceDir, functionDir);
    const chunks =
      type === "page"
        ? outputFiles
            .filter((file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"))
            .map((file) => new URL(file, outputDir).href)
        : [];

    // Preserve relative paths used by imports and WCC's new URL(..., import.meta.url).
    for (const asset of new Set([...assets, ...chunks])) {
      await copyServerFile(asset, sourceDir, functionDir);
    }

    const relativeModulePath = path
      .relative(fileURLToPath(functionsDir), fileURLToPath(moduleUrl))
      .split(path.sep)
      .join("/");
    const pathname = entry.segment ? `${basePath}${entry.segment.pathname}` : route;

    routes.push({
      pathname: pathname.replace(/\/$/, "") || "/",
      specifier: `./${relativeModulePath}`,
      type,
    });
  }

  // getDynamicPages excludes static exports and routes expanded through getStaticPaths.
  const entries = [
    ...pages.map((entry) => ({ ...entry, type: "page" })),
    ...apis.map((entry) => ({ ...entry, type: "api" })),
  ].sort(compareRoutes);

  for (const entry of entries) {
    await copyFunction(entry, entry.type);
  }

  await fs.writeFile(new URL("./worker.js", functionsDir), generateWorker(routes, basePath));

  // Keep Greenwood's server bundles available for local serve, but exclude them from static hosting.
  await fs.appendFile(
    new URL("./.assetsignore", outputDir),
    `\n# Server modules are deployed separately from static assets.\n${[...serverFiles].map((file) => `/${file}`).join("\n")}\n`,
  );
}

/** @type {import('./types/index.d.ts').CloudflareAdapter} */
const greenwoodPluginAdapterCloudflare = () => [
  {
    type: "adapter",
    name: "plugin-adapter-cloudflare",
    provider: (compilation) => () => cloudflareAdapter(compilation),
  },
];

export { greenwoodPluginAdapterCloudflare };
