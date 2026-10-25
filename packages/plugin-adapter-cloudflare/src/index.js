import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDynamicPages } from "@greenwood/cli/src/lib/graph-utils.js";

const ISOLATION_BINDING = "GREENWOOD_ISOLATION";
const ISOLATED_ENTRY = "__greenwood-route-worker.js";

function generateWorker(routes, basePath) {
  const hasIsolation = routes.some((route) => route.isolation);
  const entries = routes.map(
    ({ pathname, specifier, type, isolation }) => `  {
    pattern: new URLPattern({ pathname: ${JSON.stringify(pathname)} }),
    load: () => import(${JSON.stringify(specifier)}),
    type: ${JSON.stringify(type)},
    isolation: ${isolation},
  },`,
  );

  const isolationSupport = hasIsolation
    ? `import { WorkerEntrypoint } from 'cloudflare:workers';

// Give isolated routes a serializable RPC binding instead of the native asset binding.
// https://developers.cloudflare.com/dynamic-workers/usage/bindings/
export class GreenwoodAssets extends WorkerEntrypoint {
  fetch(request) {
    return this.env.ASSETS.fetch(request);
  }
}

// Forward child Worker logs and exceptions to the parent Worker's observability.
export class GreenwoodRouteLogs extends WorkerEntrypoint {
  tail(events) {
    for (const event of events) {
      for (const log of event.logs ?? []) {
        const level = ['debug', 'info', 'warn', 'error'].includes(log.level) ? log.level : 'log';
        console[level]({ route: this.ctx.props.route, message: log.message });
      }
      for (const exception of event.exceptions ?? []) {
        console.error({ route: this.ctx.props.route, ...exception });
      }
    }
  }
}

async function invokeIsolatedRoute(route, request, params, env, ctx) {
  const { ${ISOLATION_BINDING}: loader, ASSETS, ...bindings } = env;

  if (!loader) {
    throw new Error('Route isolation requires a Worker Loader binding named ${ISOLATION_BINDING}');
  }

  const pathname = new URL(request.url).pathname;
  let stage = 'import route code';

  try {
    // Import code as strings, without evaluating route modules in the parent isolate.
    const { default: code } = await route.load();
    stage = 'prepare bindings';
    const assets = ASSETS ? { ASSETS: ctx.exports.GreenwoodAssets({}) } : {};
    const tails = [ctx.exports.GreenwoodRouteLogs({ props: { route: pathname } })];

    stage = 'create worker';
    const worker = loader.load({ ...code, env: { ...bindings, ...assets }, tails });
    stage = 'get entrypoint';
    const entrypoint = worker.getEntrypoint();

    // load() creates a fresh Worker for each request; native RPC preserves body streams.
    stage = 'invoke route';
    return await entrypoint.handle(request, params);
  } catch (error) {
    // Keep platform error references and identify which isolation operation failed.
    console.error({
      source: 'greenwood-isolation',
      route: pathname,
      stage,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

`
    : "";

  return `${isolationSupport}const routes = [
${entries.join("\n")}
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1) || '/'
      : url.pathname;

    for (const route of routes) {
      const match = route.pattern.exec({ pathname });

      if (match) {
        const params = match.pathname.groups;

${
  hasIsolation
    ? `        if (route.isolation) {
          return invokeIsolatedRoute(route, request, params, env, ctx);
        }

`
    : ""
}        const { handler } = await route.load();

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

function generateIsolatedEntry(specifier, type) {
  return `import { WorkerEntrypoint } from 'cloudflare:workers';
import { handler } from ${JSON.stringify(specifier)};

export default class extends WorkerEntrypoint {
  async handle(request, params) {
    const response = await handler(request, ${type === "page" ? "params" : "{ params }"});

    if (!(response instanceof Response)) {
      throw new TypeError('Isolated route handlers must return a Response object');
    }

    return response;
  }
}
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

async function cloudflareAdapter(compilation, options) {
  const { compatibilityDate = "2026-10-03", compatibilityFlags = ["new_module_registry"] } =
    options;
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

  async function copyServerFile(href, sourceDir, functionDir, modules) {
    const source = new URL(href);
    const relativePath = path.relative(fileURLToPath(sourceDir), fileURLToPath(source));

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(
        `Cloudflare adapter asset is outside its route bundle directory: ${source.href}`,
      );
    }

    const destination = new URL(relativePath.split(path.sep).join("/"), functionDir);

    if (modules) {
      modules[relativePath.split(path.sep).join("/")] = await fs.readFile(source, "utf-8");
    } else {
      await fs.mkdir(new URL("./", destination), { recursive: true });
      await fs.copyFile(source, destination);
    }
    serverFiles.add(
      path.relative(fileURLToPath(outputDir), fileURLToPath(source)).split(path.sep).join("/"),
    );

    return destination;
  }

  async function copyFunction(entry, type) {
    const { id, outputHref, route, assets = [] } = entry;
    const isolation = Boolean(entry.isolation || compilation.config.isolation);
    const modules = isolation ? {} : undefined;
    const routePath = route.replace(/^\/+|\/+$/g, "");
    const functionDir = new URL(`./${routePath ? `${routePath}/` : ""}`, functionsDir);
    // API manifest outputHref can retain its source route path with a basePath.
    // Greenwood emits API entry modules using their normalized route IDs.
    const sourceHref = type === "api" ? new URL(`./api/${id}.js`, outputDir).href : outputHref;
    const sourceDir = new URL("./", sourceHref);
    let moduleUrl = await copyServerFile(sourceHref, sourceDir, functionDir, modules);
    const chunks =
      type === "page"
        ? outputFiles
            .filter((file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"))
            .map((file) => new URL(file, outputDir).href)
        : [];

    // Preserve relative paths used by imports and WCC's new URL(..., import.meta.url).
    for (const asset of new Set([...assets, ...chunks])) {
      await copyServerFile(asset, sourceDir, functionDir, modules);
    }

    if (isolation) {
      modules[ISOLATED_ENTRY] = generateIsolatedEntry(
        `./${path.basename(moduleUrl.pathname)}`,
        type,
      );
      moduleUrl = new URL(`./${id}.worker-code.js`, functionDir);

      await fs.mkdir(functionDir, { recursive: true });
      await fs.writeFile(
        moduleUrl,
        `export default ${JSON.stringify(
          {
            compatibilityDate,
            compatibilityFlags,
            mainModule: ISOLATED_ENTRY,
            modules,
          },
          null,
          2,
        )};\n`,
      );
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
      isolation,
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
const greenwoodPluginAdapterCloudflare = (options = {}) => [
  {
    type: "adapter",
    name: "plugin-adapter-cloudflare",
    provider: (compilation) => () => cloudflareAdapter(compilation, options),
  },
];

export { greenwoodPluginAdapterCloudflare };
