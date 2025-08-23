import fs from "node:fs/promises";
import {
  checkResourceExists,
  trackResourcesForRoute,
  mergeResponse,
} from "../lib/resource-utils.js";
import os from "node:os";
import { WorkerPool } from "../lib/threadpool.js";
import { asyncForEach } from "../lib/async-utils.js";

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

async function preRenderCompilationWorker(compilation, workerPrerender) {
  const pages = compilation.graph.filter(
    (page) =>
      !page.isSSR || (page.isSSR && page.prerender) || (page.isSSR && compilation.config.prerender),
  );
  const { context, config } = compilation;
  const plugins = getPluginInstances(compilation);

  console.info("pages to generate", `\n ${pages.map((page) => page.route).join("\n ")}`);

  const pool = new WorkerPool(
    os.cpus().length,
    new URL("../lib/ssr-route-worker.js", import.meta.url),
  );

  await asyncForEach(pages, async (page) => {
    const { route, outputHref } = page;
    const scratchUrl = toScratchUrl(outputHref, context);
    const url = new URL(`http://localhost:${config.port}${route}`);
    const request = new Request(url);
    let ssrContents;

    // do we negate the worker pool by also running this, outside the pool?
    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    // hack to avoid over-rendering SSR content
    // https://github.com/ProjectEvergreen/greenwood/issues/1044
    // https://github.com/ProjectEvergreen/greenwood/issues/988#issuecomment-1288168858
    if (page.isSSR) {
      const ssrContentsMatch = /<!-- greenwood-ssr-start -->(.*.)<!-- greenwood-ssr-end -->/s;
      const match = body.match(ssrContentsMatch);

      if (match) {
        ssrContents = match[0];
        body = body.replace(ssrContents, "<!-- greenwood-ssr-start --><!-- greenwood-ssr-end -->");

        ssrContents = ssrContents
          .replace("<!-- greenwood-ssr-start -->", "")
          .replace("<!-- greenwood-ssr-end -->", "");
      }
    }

    const resources = await trackResourcesForRoute(body, compilation, route);
    const scripts = resources
      .filter((resource) => resource.type === "script")
      .map((resource) => resource.sourcePathURL.href);

    body = await new Promise((resolve, reject) => {
      pool.runTask(
        {
          executeModuleUrl: workerPrerender.executeModuleUrl.href,
          modulePath: null,
          compilation: JSON.stringify(compilation),
          page: JSON.stringify(page),
          prerender: true,
          htmlContents: body,
          scripts: JSON.stringify(scripts),
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result.html);
        },
      );
    });

    if (page.isSSR) {
      body = body.replace("<!-- greenwood-ssr-start --><!-- greenwood-ssr-end -->", ssrContents);
    }

    await createOutputDirectory(new URL(scratchUrl.href.replace("index.html", "")));
    await fs.writeFile(scratchUrl, body);

    console.info("generated page...", route);
  });
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { config, context } = compilation;
  const renderer = (await import(customPrerender.customUrl)).default;
  const { importMaps } = config.polyfills;

  console.info(
    "pages to generate",
    `\n ${compilation.graph.map((page) => page.route).join("\n ")}`,
  );

  await renderer(compilation, async (page, body) => {
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

    // clean this up to avoid sending webcomponents-bundle to rollup
    body = body.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, "");

    await trackResourcesForRoute(body, compilation, route);
    await createOutputDirectory(new URL(scratchUrl.href.replace("index.html", "")));
    await fs.writeFile(scratchUrl, body);

    console.info("generated page...", route);
  });
}

async function staticRenderCompilation(compilation) {
  const { config, context } = compilation;
  const pages = compilation.graph.filter((page) => !page.isSSR || (page.isSSR && page.prerender));
  const plugins = getPluginInstances(compilation);

  console.info("pages to generate", `\n ${pages.map((page) => page.route).join("\n ")}`);

  await asyncForEach(pages, async (page) => {
    const { route, outputHref } = page;
    const scratchUrl = toScratchUrl(outputHref, context);
    const url = new URL(`http://localhost:${config.port}${route}`);
    const request = new Request(url);

    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    await trackResourcesForRoute(body, compilation, route);
    await createOutputDirectory(new URL(scratchUrl.href.replace("index.html", "")));
    await fs.writeFile(scratchUrl, body);

    console.info("generated page...", route);

    return Promise.resolve();
  });
}

export { preRenderCompilationWorker, preRenderCompilationCustom, staticRenderCompilation };
