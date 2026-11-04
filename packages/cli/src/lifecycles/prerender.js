import fs from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { parse } from "node-html-parser";
import {
  checkResourceExists,
  trackResourcesForRoute,
  mergeResponse,
  getScriptResources,
  isPrerenderScript,
} from "../lib/resource-utils.js";
import { WorkerPool } from "../lib/threadpool.js";
import { runWithConcurrency } from "../lib/async-utils.js";
import { getPrerenderPages, getStaticPages } from "../lib/graph-utils.js";
import { SSR_START_MARKER, SSR_END_MARKER } from "../lib/layout-utils.js";
import {
  getParamsFromSegment,
  getStaticRouteFromDynamicRoute,
  getOutputHrefForStaticPath,
} from "../lib/url-utils.js";

async function createOutputDirectory(outputDir) {
  // ignore creating directory for 404 pages since they live at the root of the output directory
  if (!outputDir.href.endsWith("404.html") && !(await checkResourceExists(outputDir))) {
    await fs.mkdir(outputDir, {
      recursive: true,
    });
  }
}

async function servePage(url, request, plugins) {
  let response = new Response("");

  for (const plugin of plugins) {
    if (plugin.shouldServe && (await plugin.shouldServe(url, request))) {
      response = await plugin.serve(url, request);
      break;
    }
  }

  return response;
}

async function interceptPage(url, request, plugins, body) {
  let response = new Response(body, {
    headers: new Headers({ "Content-Type": "text/html" }),
  });

  for (const plugin of plugins) {
    if (
      plugin.shouldPreIntercept &&
      (await plugin.shouldPreIntercept(url, request, response.clone()))
    ) {
      response = mergeResponse(response, await plugin.preIntercept(url, request, response.clone()));
    }

    if (plugin.shouldIntercept && (await plugin.shouldIntercept(url, request, response.clone()))) {
      response = mergeResponse(response, await plugin.intercept(url, request, response.clone()));
    }
  }

  return response;
}

function getPluginInstances(compilation) {
  return [...compilation.config.plugins]
    .filter(
      (plugin) => plugin.type === "resource" && plugin.name !== "plugin-node-modules:resource",
    )
    .map((plugin) => {
      return plugin.provider(compilation);
    });
}

function toScratchUrl(outputHref, context) {
  const { outputDir, scratchDir } = context;

  return new URL(`./${outputHref.replace(outputDir.href, "")}`, scratchDir);
}

// Execute browser scripts against HTML that has already been rendered.
// For SSR pages, preserve the route content and only transform the surrounding application shell.
async function executePageScripts(compilation, workerPrerender, pool, page, html, params) {
  const development = process.env.__GWD_COMMAND__ === "develop";
  const ssrContentsMatch = new RegExp(`${SSR_START_MARKER}(.*?)${SSR_END_MARKER}`, "s");
  const ssrPlaceholder = `${SSR_START_MARKER}${SSR_END_MARKER}`;
  const ssrMatch = page.isSSR ? html.match(ssrContentsMatch) : null;
  const ssrContents = ssrMatch ? ssrMatch[1] : null;
  let body = ssrMatch ? html.replace(ssrMatch[0], ssrPlaceholder) : html;
  const resources = development
    ? await getScriptResources(body, compilation.context, true)
    : await trackResourcesForRoute(body, compilation, page.route);
  const scripts = resources
    .filter((resource) => resource.type === "script")
    .map((resource) => resource.sourcePathURL.href);

  let worker;

  try {
    body = await new Promise((resolve, reject) => {
      const task = {
        executeModuleUrl: workerPrerender.executeModuleUrl.href,
        moduleUrl: null,
        compilation: JSON.stringify(compilation),
        page: JSON.stringify(page),
        prerender: true,
        htmlContents: body,
        scripts: JSON.stringify(scripts),
        params: params ? JSON.stringify(params) : params,
      };

      if (pool) {
        pool.runTask(task, (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result.html);
        });
      } else {
        // A fresh worker also refreshes transitive imports and custom element registrations.
        worker = new Worker(new URL("../lib/ssr-route-worker.js", import.meta.url));
        worker.once("message", (result) => resolve(result.html));
        worker.once("error", reject);
        worker.once("exit", (code) => reject(new Error(`Worker stopped with exit code ${code}`)));
        worker.postMessage(task);
      }
    });
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }

  if (development) {
    const root = parse(body, { comment: true });
    const { optimization } = compilation.config;

    for (const script of root.querySelectorAll("script")) {
      const attribute = script.getAttribute("data-gwd-opt");
      const isStatic = attribute === "static" || optimization === "static";
      const isInline = attribute === "inline" || optimization === "inline";

      // Match production script optimization precedence while retaining browser tooling and data.
      if (isStatic && (!script.getAttribute("src") || !isInline) && isPrerenderScript(script)) {
        script.remove();
      }
    }

    body = root.toString();
  }

  return ssrContents === null ? body : body.replace(ssrPlaceholder, () => ssrContents);
}

async function preRenderCompilationWorker(compilation, workerPrerender) {
  const staticPages = new Set(getStaticPages(compilation));
  const pages = getPrerenderPages(compilation).filter((page) => staticPages.has(page));
  const { context, config } = compilation;
  const pool = new WorkerPool(
    config.concurrency,
    new URL("../lib/ssr-route-worker.js", import.meta.url),
  );

  console.info("pages to prerender", `\n ${pages.map((page) => page.route).join("\n ")}`);

  await runWithConcurrency(pages, config.concurrency, async (page) => {
    if (page.staticPaths) {
      for (const staticPath of page.staticPaths) {
        const { route, outputHref, segment } = page;
        const staticRoute = getStaticRouteFromDynamicRoute(staticPath, segment, route);
        const scratchUrl = toScratchUrl(
          getOutputHrefForStaticPath(staticPath, segment, outputHref),
          context,
        );
        const params = getParamsFromSegment(compilation, page.segment, staticRoute) ?? {};
        const body = await executePageScripts(
          compilation,
          workerPrerender,
          pool,
          page,
          await fs.readFile(scratchUrl, "utf-8"),
          params,
        );

        await fs.writeFile(scratchUrl, body);
        console.info("prerendered static path...", staticRoute);
      }
    } else {
      const scratchUrl = toScratchUrl(page.outputHref, context);
      const body = await executePageScripts(
        compilation,
        workerPrerender,
        pool,
        page,
        await fs.readFile(scratchUrl, "utf-8"),
      );

      await fs.writeFile(scratchUrl, body);
      console.info("prerendered page...", page.route);
    }
  });
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { config, context } = compilation;
  const renderer = (await import(customPrerender.customUrl)).default;
  const { importMaps } = config.polyfills;
  const pages = getPrerenderPages(compilation).filter((page) => !page.isSSR);
  const prerenderCompilation = { ...compilation, graph: pages };

  console.info("pages to prerender", `\n ${pages.map((page) => page.route).join("\n ")}`);

  await renderer(prerenderCompilation, async (page, body) => {
    const { route, outputHref } = page;
    const scratchUrl = toScratchUrl(outputHref, context);

    // clean up special Greenwood dev only assets that would come through if prerendering with a headless browser
    if (importMaps) {
      body = body.replace(/<script type="importmap-shim">.*?<\/script>/s, "");
      body = body.replace(/<script defer="" src="(.*es-module-shims.js)"><\/script>/, "");
      body = body.replace(/type="module-shim"/g, 'type="module"');
    } else {
      body = body.replace(/<script type="importmap">.*?<\/script>/s, "");
    }

    await trackResourcesForRoute(body, compilation, route);
    await createOutputDirectory(new URL(scratchUrl.href.replace("index.html", "")));
    await fs.writeFile(scratchUrl, body);

    console.info("generated page...", route);
  });
}

async function staticRenderCompilation(compilation, pages = getStaticPages(compilation)) {
  const { config, context } = compilation;
  const plugins = getPluginInstances(compilation);
  const renderPage = async (route, outputHref, message) => {
    const scratchUrl = toScratchUrl(outputHref, context);
    const url = new URL(`http://localhost:${config.port}${route}`);
    const request = new Request(url);
    let body = await (await servePage(url, request, plugins)).text();

    body = await (await interceptPage(url, request, plugins, body)).text();

    await trackResourcesForRoute(body, compilation, route);
    await createOutputDirectory(new URL(scratchUrl.href.replace("index.html", "")));
    await fs.writeFile(scratchUrl, body);
    console.info(message, route);
  };

  console.info("pages to generate", `\n ${pages.map((page) => page.route).join("\n ")}`);

  await runWithConcurrency(pages, config.concurrency, async (page) => {
    if (page.staticPaths) {
      for (const staticPath of page.staticPaths) {
        const staticRoute = getStaticRouteFromDynamicRoute(staticPath, page.segment, page.route);
        const outputHref = getOutputHrefForStaticPath(staticPath, page.segment, page.outputHref);

        await renderPage(staticRoute, outputHref, "generated static path...");
      }
    } else {
      await renderPage(page.route, page.outputHref, "generated page...");
    }

    return Promise.resolve();
  });
}

export {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  executePageScripts,
  staticRenderCompilation,
};
