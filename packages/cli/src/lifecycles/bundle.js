// @ts-nocheck
import fs from "node:fs/promises";
import {
  getRollupConfigForApiRoutes,
  getRollupConfigForBrowserScripts,
  getRollupConfigForSsrPages,
} from "../config/rollup.config.js";
import { getAppLayout, getPageLayout, getGreenwoodScripts } from "../lib/layout-utils.js";
import { hashString } from "../lib/hashing-utils.js";
import {
  checkResourceExists,
  mergeResponse,
  normalizePathnameForWindows,
  trackResourcesForRoute,
} from "../lib/resource-utils.js";
import path from "node:path";
import { rollup } from "rollup";
import { pruneGraph } from "../lib/content-utils.js";
import { asyncForEach } from "../lib/async-utils.js";

async function interceptPage(url, request, plugins, body) {
  let response = new Response(body, {
    headers: new Headers({ "Content-Type": "text/html" }),
  });

  for (const plugin of plugins) {
    if (plugin.shouldPreIntercept && (await plugin.shouldPreIntercept(url, request, response))) {
      response = await plugin.preIntercept(url, request, response);
    }

    if (plugin.shouldIntercept && (await plugin.shouldIntercept(url, request, response))) {
      response = await plugin.intercept(url, request, response);
    }
  }

  return response;
}

async function optimizePage(url, plugins, body) {
  let response = new Response(body, {
    headers: new Headers({ "Content-Type": "text/html" }),
  });

  for (const plugin of plugins) {
    if (plugin.shouldOptimize && (await plugin.shouldOptimize(url, response.clone()))) {
      response = mergeResponse(response.clone(), await plugin.optimize(url, response.clone()));
    }
  }

  return response;
}

function getPluginInstances(compilation, pluginFilters = []) {
  return [...compilation.config.plugins]
    .filter(
      (plugin) =>
        plugin.type === "resource" &&
        plugin.name !== "plugin-node-modules:resource" &&
        pluginFilters.indexOf(plugin.name) < 0,
    )
    .map((plugin) => {
      return plugin.provider(compilation);
    });
}

async function emitResources(compilation) {
  const { outputDir, scratchDir } = compilation.context;
  const { resources, graph, manifest } = compilation;

  // https://stackoverflow.com/a/56150320/417806
  await fs.writeFile(
    new URL("./resources.json", outputDir),
    JSON.stringify(resources, (key, value) => {
      if (value instanceof Map) {
        return {
          dataType: "Map",
          value: [...value],
        };
      } else {
        return value;
      }
    }),
  );

  await fs.writeFile(
    new URL("./manifest.json", scratchDir),
    JSON.stringify(manifest, (key, value) => {
      if (value instanceof Map) {
        return {
          dataType: "Map",
          value: [...value],
        };
      } else {
        return value;
      }
    }),
  );

  await fs.writeFile(new URL("./graph.json", outputDir), JSON.stringify(graph));
}

async function cleanUpResources(compilation) {
  const { outputDir } = compilation.context;

  await asyncForEach(compilation.resources.values(), async (resource) => {
    const { src, optimizedFileName, optimizationAttr } = resource;
    const optConfig = ["inline", "static"].indexOf(compilation.config.optimization) >= 0;
    const optAttr = ["inline", "static"].indexOf(optimizationAttr) >= 0;

    if (optimizedFileName && (!src || optAttr || optConfig)) {
      await fs.unlink(new URL(`./${optimizedFileName}`, outputDir));
    }
  });
}

async function optimizeStaticPages(compilation, plugins) {
  const { scratchDir, outputDir } = compilation.context;

  const pages = compilation.graph.filter(
    (page) =>
      !page.isSSR || (page.isSSR && page.prerender) || (page.isSSR && compilation.config.prerender),
  );

  await asyncForEach(pages, async (page) => {
    const { route, outputHref } = page;
    const outputDirUrl = new URL(outputHref.replace("index.html", "").replace("404.html", ""));
    const url = new URL(`http://localhost:${compilation.config.port}${route}`);
    const contents = await fs.readFile(
      new URL(`./${outputHref.replace(outputDir.href, "")}`, scratchDir),
      "utf-8",
    );
    const headers = new Headers({ "Content-Type": "text/html" });
    let response = new Response(contents, { headers });

    if (!(await checkResourceExists(outputDirUrl))) {
      await fs.mkdir(outputDirUrl, {
        recursive: true,
      });
    }

    for (const plugin of plugins) {
      if (plugin.shouldOptimize && (await plugin.shouldOptimize(url, response.clone()))) {
        const currentResponse = await plugin.optimize(url, response.clone());

        response = mergeResponse(response.clone(), currentResponse.clone());
      }
    }

    // clean up optimization markers
    const body = (await response.text()).replace(/data-gwd-opt=".*?[a-z]"/g, "");

    await fs.writeFile(new URL(outputHref), body);
  });
}

async function bundleStyleResources(compilation, resourcePlugins) {
  const { outputDir } = compilation.context;

  await asyncForEach(compilation.resources.values(), async (resource) => {
    const { contents, src = "", type } = resource;

    if (["style", "link"].includes(type)) {
      const resourceKey = resource.sourcePathURL.pathname;
      const srcPath = src && src.replace(/\.\.\//g, "").replace("./", "");
      let optimizedFileName;
      let optimizedFileContents;

      if (src) {
        const basename = path.basename(srcPath);
        const basenamePieces = path.basename(srcPath).split(".");
        const fileNamePieces = srcPath.split("/").filter((piece) => piece !== ""); // normalize by removing any leading /'s

        optimizedFileName =
          srcPath.indexOf("/node_modules") >= 0
            ? `${basenamePieces[0]}.${hashString(contents)}.css`
            : fileNamePieces
                .join("/")
                .replace(basename, `${basenamePieces[0]}.${hashString(contents)}.css`);
      } else {
        optimizedFileName = `${hashString(contents)}.css`;
      }

      const outputPathRoot = new URL(`./${optimizedFileName}`, outputDir).pathname
        .split("/")
        .slice(0, -1)
        .join("/")
        .concat("/");
      const outputPathRootUrl = new URL(`file://${outputPathRoot}`);

      if (!(await checkResourceExists(outputPathRootUrl))) {
        await fs.mkdir(new URL(`file://${outputPathRoot}`), {
          recursive: true,
        });
      }

      const url = resource.sourcePathURL;
      const contentType = "text/css";
      const headers = new Headers({ "Content-Type": contentType, Accept: contentType });
      const request = new Request(url, { headers });
      const initResponse = new Response(contents, { headers });

      let response = initResponse;

      for (const plugin of resourcePlugins) {
        const shouldServe = plugin.shouldServe && (await plugin.shouldServe(url, request));

        if (shouldServe) {
          const currentResponse = await plugin.serve(url, request);
          const mergedResponse = mergeResponse(response.clone(), currentResponse.clone());

          if (mergedResponse.headers.get("Content-Type").indexOf(contentType) >= 0) {
            response = mergedResponse.clone();
          }
        }
      }

      for (const plugin of resourcePlugins) {
        const shouldPreIntercept =
          plugin.shouldPreIntercept &&
          (await plugin.shouldPreIntercept(url, request, response.clone()));

        if (shouldPreIntercept) {
          const currentResponse = await plugin.preIntercept(url, request, response.clone());
          const mergedResponse = mergeResponse(response.clone(), currentResponse.clone());

          if (mergedResponse.headers.get("Content-Type").indexOf(contentType) >= 0) {
            response = mergedResponse.clone();
          }
        }
      }

      for (const plugin of resourcePlugins) {
        const shouldIntercept =
          plugin.shouldIntercept && (await plugin.shouldIntercept(url, request, response.clone()));

        if (shouldIntercept) {
          const currentResponse = await plugin.intercept(url, request, response.clone());
          const mergedResponse = mergeResponse(response.clone(), currentResponse.clone());

          if (mergedResponse.headers.get("Content-Type").indexOf(contentType) >= 0) {
            response = mergedResponse.clone();
          }
        }
      }

      for (const plugin of resourcePlugins) {
        const shouldOptimize =
          plugin.shouldOptimize && (await plugin.shouldOptimize(url, response.clone()));

        if (shouldOptimize) {
          response = await plugin.optimize(url, response.clone());
        }
      }

      optimizedFileContents = await response.text();

      compilation.resources.set(resourceKey, {
        ...compilation.resources.get(resourceKey),
        optimizedFileName,
        optimizedFileContents,
      });

      await fs.writeFile(new URL(`./${optimizedFileName}`, outputDir), optimizedFileContents);
    }
  });
}

async function bundleApiRoutes(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const apiConfigs = await getRollupConfigForApiRoutes(compilation);

  if (apiConfigs.length > 0 && apiConfigs[0].input.length !== 0) {
    console.info("bundling API routes...");
    await asyncForEach(apiConfigs, async (rollupConfig) => {
      const bundle = await rollup(rollupConfig);
      await bundle.write(rollupConfig.output);
    });
  }
}

async function bundleSsrPages(compilation, optimizePlugins) {
  const { context, config } = compilation;
  const ssrPages = compilation.graph.filter((page) => page.isSSR && !page.prerender);
  const ssrPrerenderPagesRouteMapper = {};
  const input = [];

  if (!config.prerender && ssrPages.length > 0) {
    const { executeModuleUrl } = config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider();
    const { pagesDir, scratchDir } = context;
    // SSR pages do not support static / SPA routing (yet)
    // https://github.com/ProjectEvergreen/greenwood/discussions/1033
    const plugins = getPluginInstances(compilation, ["plugin-static-router"]);

    // one pass to generate initial static HTML and to track all combined static resources across layouts
    // and before we optimize so that all bundled assets can tracked up front
    // would be nice to see if this can be done in a single pass though...
    await asyncForEach(ssrPages, async (page) => {
      const { route } = page;
      let staticHtml = "<content-outlet></content-outlet>";

      staticHtml = await getPageLayout(staticHtml, compilation, page);
      staticHtml = await getAppLayout(staticHtml, compilation, page);
      staticHtml = await getGreenwoodScripts(staticHtml, compilation);

      staticHtml = await (
        await interceptPage(
          new URL(`http://localhost:8080${route}`),
          new Request(new URL(`http://localhost:8080${route}`)),
          getPluginInstances(compilation),
          staticHtml,
        )
      ).text();

      await trackResourcesForRoute(staticHtml, compilation, route);

      ssrPrerenderPagesRouteMapper[route] = staticHtml;
    });

    // technically this happens in the start of bundleCompilation once
    // so might be nice to detect those static assets to see if they have be "de-duped" from bundling here
    await bundleScriptResources(compilation);
    await bundleStyleResources(compilation, optimizePlugins);

    // second pass to link all bundled assets to their resources before optimizing and generating SSR bundles
    await asyncForEach(ssrPages, async (page) => {
      const { id, route, pageHref } = page;
      const pagePath = new URL(pageHref).pathname.replace(pagesDir.pathname, "./");
      const entryFileUrl = new URL(pageHref);
      const entryFileOutputUrl = new URL(
        `file://${entryFileUrl.pathname.replace(pagesDir.pathname, scratchDir.pathname)}`,
      );
      const outputPathRootUrl = new URL(`file://${path.dirname(entryFileOutputUrl.pathname)}/`);
      const pagesPathDiff = context.pagesDir.pathname.replace(
        context.projectDirectory.pathname,
        "",
      );
      const relativeDepth = "../".repeat(pagePath.split("/").length - 1);

      let staticHtml = ssrPrerenderPagesRouteMapper[route];
      staticHtml = await (
        await optimizePage(new URL(`http://localhost:8080${route}`), plugins, staticHtml)
      ).text();
      staticHtml = staticHtml.replace(/[`\\$]/g, "\\$&"); // https://stackoverflow.com/a/75688937/417806

      if (!(await checkResourceExists(outputPathRootUrl))) {
        await fs.mkdir(outputPathRootUrl, {
          recursive: true,
        });
      }

      // would be nice to find out a better way to write out / generate this inline code "facade"
      // and how to calculate the relative path to the src/ page's entry point in the user's workspace
      // https://github.com/ProjectEvergreen/greenwood/pull/1482#issuecomment-2905643391
      /* eslint-disable no-useless-escape */
      await fs.writeFile(
        entryFileOutputUrl,
        `
        import { executeRouteModule } from '${normalizePathnameForWindows(executeModuleUrl)}';

        const moduleUrl = new URL('${relativeDepth}${pagesPathDiff}${pagePath.replace("./", "")}', import.meta.url);

        export async function handler(request) {
          const compilation = JSON.parse(\`${JSON.stringify({
            ...compilation,
            graph: pruneGraph(compilation.graph),
          })
            .replace(/\\"/g, "&quote")
            .replace(/\\n/g, "")}\`);
          const page = JSON.parse(\`${JSON.stringify(pruneGraph([page])[0])
            .replace(/\\"/g, "&quote")
            .replace(/\\n/g, "")}\`);
          const data = await executeRouteModule({ moduleUrl, compilation, page, request, contentOptions: { body: true } });
          let staticHtml = \`${staticHtml}\`;

          if (data.body) {
            staticHtml = staticHtml.replace(\/\<content-outlet>(.*)<\\/content-outlet>\/s, data.body);
          }

          return new Response(staticHtml, {
            headers: {
              'Content-Type': 'text/html'
            }
          });
        }
      `,
      );
      /* eslint-enable no-useless-escape */

      input.push({
        id,
        inputPath: normalizePathnameForWindows(entryFileOutputUrl),
      });
    });

    const ssrConfigs = await getRollupConfigForSsrPages(compilation, input);

    if (ssrConfigs.length > 0 && ssrConfigs[0].input !== "") {
      console.info("bundling dynamic pages...");
      await asyncForEach(ssrConfigs, async (rollupConfig) => {
        const bundle = await rollup(rollupConfig);
        await bundle.write(rollupConfig.output);
      });
    }
  }
}

async function bundleScriptResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const [rollupConfig] = await getRollupConfigForBrowserScripts(compilation);

  if (rollupConfig.input.length !== 0) {
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
  }
}

const bundleCompilation = async (compilation) => {
  const optimizeResourcePlugins = compilation.config.plugins
    .filter((plugin) => {
      return plugin.type === "resource";
    })
    .map((plugin) => {
      return plugin.provider(compilation);
    });

  console.info("bundling static assets...");

  // need styles bundled first for usage with import attributes syncing in Rollup
  await bundleStyleResources(compilation, optimizeResourcePlugins);

  await Promise.all([await bundleApiRoutes(compilation), await bundleScriptResources(compilation)]);

  // bundleSsrPages depends on bundleScriptResources having run first
  await bundleSsrPages(compilation, optimizeResourcePlugins);

  console.info("optimizing static pages....");
  await optimizeStaticPages(compilation, optimizeResourcePlugins);
  await cleanUpResources(compilation);
  await emitResources(compilation);
};

export { bundleCompilation };
