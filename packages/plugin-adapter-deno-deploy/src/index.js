import fs from "node:fs/promises";
import { getDynamicPages } from "@greenwood/cli/src/lib/graph-utils.js";

const ADAPTER_OUTPUT_DIR = ".deno-deploy";
const ROUTE_WORKER_FILE = "route-worker.js";

function generateServer(compilation, serveStatic) {
  const { outputDir } = compilation.context;
  const { basePath, isolation: isolationMode } = compilation.config;
  const dynamicPages = getDynamicPages(compilation);
  const imports = [];
  const routes = [];

  const addRoute = ({ id, outputHref, route, segment, isolation }, type, index) => {
    const handlerAlias = `$handler${index}`;
    const outputPath = type === "api" ? `api/${id}.js` : outputHref.replace(outputDir.href, "");
    const pathname = segment ? `${basePath}${segment.pathname}` : route;
    const shouldIsolate = isolation || isolationMode;
    const target = shouldIsolate
      ? `moduleUrl: new URL("../public/${outputPath}", import.meta.url).href, isolation: true`
      : `handler: ${handlerAlias}, isolation: false`;

    if (!shouldIsolate) {
      imports.push(`import { handler as ${handlerAlias} } from "../public/${outputPath}";`);
    }

    routes.push(
      `  { pattern: new URLPattern({ pathname: ${JSON.stringify(
        pathname,
      )} }), ${target}, type: "${type}", hasParams: ${Boolean(segment)} },`,
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

async function invokeIsolatedRoute(route, request, params) {
  const body = ["GET", "HEAD"].includes(request.method.toUpperCase())
    ? null
    : await request.arrayBuffer();
  const worker = new Worker(new URL("./${ROUTE_WORKER_FILE}", import.meta.url).href, {
    type: "module",
  });

  return await new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.terminate();
    };

    worker.addEventListener("message", ({ data }) => {
      cleanup();

      if (!data.ok) {
        const error = new Error(data.error.message);

        error.name = data.error.name;
        error.stack = data.error.stack;
        reject(error);
        return;
      }

      const { response } = data;

      resolve(new Response(response.body, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      }));
    }, { once: true });
    worker.addEventListener("error", (event) => {
      cleanup();
      reject(event.error ?? new Error(event.message));
    }, { once: true });

    const message = {
      moduleUrl: route.moduleUrl,
      type: route.type,
      params,
      request: {
        url: request.url,
        method: request.method,
        headers: [...request.headers.entries()],
        body,
      },
    };

    try {
      worker.postMessage(message, body ? [body] : []);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

Deno.serve(async (request) => {
  const url = new URL(request.url);

  for (const route of routes) {
    const match = route.pattern.exec(url);

    if (match) {
      const params = route.hasParams ? match.pathname.groups : undefined;

      if (route.isolation) {
        return await invokeIsolatedRoute(route, request, params);
      }

      return route.type === "page"
        ? await route.handler(request, params)
        : await route.handler(request, { params });
    }
  }

  if (url.pathname.startsWith(${JSON.stringify(`${basePath}/api/`)})) {
    return Response.json({ error: "API route not found" }, { status: 404 });
  }

  ${fallback}
});
`;
}

function generateRouteWorker() {
  return `self.addEventListener("message", async ({ data }) => {
  try {
    const { moduleUrl, type, params, request: requestData } = data;
    const { handler } = await import(moduleUrl);
    const request = new Request(requestData.url, {
      method: requestData.method,
      headers: requestData.headers,
      body: requestData.body,
    });
    const response = type === "page"
      ? await handler(request, params)
      : await handler(request, { params });

    if (!(response instanceof Response)) {
      throw new TypeError("Isolated route handlers must return a Response object");
    }

    const body = response.body === null ? null : await response.arrayBuffer();

    self.postMessage({
      ok: true,
      response: {
        body,
        headers: [...response.headers.entries()],
        status: response.status,
        statusText: response.statusText,
      },
    }, body ? [body] : []);
  } catch (cause) {
    const error = cause instanceof Error
      ? cause
      : new Error(String(cause));

    self.postMessage({
      ok: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
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
  await fs.writeFile(new URL(`./${ROUTE_WORKER_FILE}`, adapterOutputUrl), generateRouteWorker());
}

/** @type {import('deno-deploy.d.ts').DenoDeployAdapter} */
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
