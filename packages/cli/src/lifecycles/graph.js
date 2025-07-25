// @ts-nocheck
import fs from "node:fs/promises";
import fm from "front-matter";
import { checkResourceExists, requestAsObject } from "../lib/resource-utils.js";
import { activeFrontmatterKeys } from "../lib/content-utils.js";
import toc from "markdown-toc";
import { Worker } from "node:worker_threads";

function getLabelFromRoute(_route) {
  let route = _route;

  if (route === "/index/") {
    return "Home";
  } else if (route.endsWith("/index/")) {
    route = route.replace("index/", "");
  }

  return route
    .split("/")
    .filter((part) => part !== "")
    .pop()
    .split("-")
    .map((routePart) => {
      return `${routePart.charAt(0).toUpperCase()}${routePart.substring(1)}`;
    })
    .join(" ");
}

function getIdFromRelativePathPath(relativePathPath, extension) {
  return relativePathPath.replace(extension, "").replace("./", "").replace(/\//g, "-");
}

function trackCollectionsForPage(page, collections) {
  const pageCollection = page.data?.collection ?? "";

  if (pageCollection) {
    if (typeof pageCollection === "string") {
      if (!collections[pageCollection]) {
        collections[pageCollection] = [];
      }

      collections[pageCollection].push(page);
    } else if (Array.isArray(pageCollection)) {
      pageCollection.forEach((collection) => {
        if (!collections[collection]) {
          collections[collection] = [];
        }

        collections[collection].push(page);
      });
    }
  }
}

const generateGraph = async (compilation) => {
  const { context, config } = compilation;
  const { basePath } = config;
  const { pagesDir, userWorkspace, outputDir } = context;
  const customPageFormatPlugins = config.plugins
    .filter((plugin) => plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin)
    .map((plugin) => plugin.provider(compilation));

  let apis = new Map();
  let graph = [
    {
      id: "index",
      outputHref: new URL("./index.html", outputDir).href,
      route: `${basePath}/`,
      label: "Home",
      title: null,
      data: {},
      imports: [],
      resources: [],
      prerender: true,
      isolation: false,
    },
  ];

  const walkDirectoryForPages = async function (directory, pages = [], apiRoutes = new Map()) {
    const files = (await fs.readdir(directory)).filter((file) => !file.startsWith("."));

    for (const filename of files) {
      const filenameUrl = new URL(`./${filename}`, directory);
      const filenameUrlAsDir = new URL(`./${filename}/`, directory);
      const isDirectory =
        (await checkResourceExists(filenameUrlAsDir)) &&
        (await fs.stat(filenameUrlAsDir)).isDirectory();

      if (isDirectory) {
        const nextPages = await walkDirectoryForPages(filenameUrlAsDir, pages, apiRoutes);

        pages = nextPages.pages;
        apiRoutes = nextPages.apiRoutes;
      } else {
        const extension = `.${filenameUrl.pathname.split(".").pop()}`;
        const relativePagePath = filenameUrl.pathname.replace(pagesDir.pathname, "./");
        const isApiRoute = relativePagePath.startsWith("./api");
        const req = isApiRoute
          ? new Request(filenameUrl, { headers: { Accept: "text/javascript" } })
          : new Request(filenameUrl, { headers: { Accept: "text/html" } });
        let isCustom = null;

        for (const plugin of customPageFormatPlugins) {
          if (plugin.shouldServe && (await plugin.shouldServe(filenameUrl, req))) {
            isCustom = plugin.servePage;
            break;
          }
        }

        const isStatic = isCustom === "static" || extension === ".md" || extension === ".html";
        const isDynamic = isCustom === "dynamic" || extension === ".js" || extension === ".ts";
        const isPage = isStatic || isDynamic;
        let route = `${relativePagePath.replace(".", "").replace(`${extension}`, "")}`;
        let fileContents;

        if (isApiRoute) {
          if (extension !== ".js" && extension !== ".ts" && !isCustom) {
            console.warn(`${filenameUrl} is not a supported API file extension, skipping...`);
            return;
          }

          // TODO should API routes be run in isolation mode like SSR pages?
          const { isolation } = await import(filenameUrl).then((module) => module);

          /*
           * API Properties (per route)
           *----------------------
           * id: unique hyphen delimited string of the filename, relative to the page/api directory
           * pageHref: href to the page's filesystem file
           * outputHref: href of the filename to write to when generating a build
           * route: URL route for a given page on outputFilePath
           * isolation: if this should be run in isolated mode
           */
          apiRoutes.set(`${basePath}${route}`, {
            id: decodeURIComponent(
              getIdFromRelativePathPath(relativePagePath, extension).replace("api-", ""),
            ),
            pageHref: new URL(relativePagePath, pagesDir).href,
            outputHref: new URL(relativePagePath, outputDir).href.replace(extension, ".js"),
            route: `${basePath}${route}`,
            isolation,
          });
        } else if (isPage) {
          let root = filename.split("/")[filename.split("/").length - 1].replace(extension, "");
          // should we even have a default page layout?
          // https://github.com/ProjectEvergreen/greenwood/issues/1271
          let layout = "page";
          let title = null;
          let label = getLabelFromRoute(`${route}/`);
          let imports = [];
          let customData = {};
          let prerender = true;
          let isolation = false;
          let hydration = false;

          /*
           * check if additional nested directories exist to correctly determine route (minus filename)
           * examples:
           * - pages/index.{html,md,js} -> /
           * - pages/about.{html,md,js} -> /about/
           * - pages/blog/index.{html,md,js} -> /blog/
           * - pages/blog/some-post.{html,md,js} -> /blog/some-post/
           */
          if (relativePagePath.lastIndexOf("/index") > 0) {
            // https://github.com/ProjectEvergreen/greenwood/issues/455
            route =
              root === "index" || route.replace("/index", "") === `/${root}`
                ? route.replace("index", "")
                : `${route}/`;
          } else {
            route = route === "/index" ? "/" : `${route}/`;
          }

          if (isStatic) {
            fileContents = await fs.readFile(filenameUrl, "utf8");
            const { attributes } = fm(fileContents);

            layout = attributes.layout || layout;
            title = attributes.title || title;
            label = attributes.label || label;
            imports = attributes.imports || [];

            customData = attributes;
          } else if (isDynamic) {
            const routeWorkerUrl = compilation.config.plugins
              .filter((plugin) => plugin.type === "renderer")[0]
              .provider(compilation).executeModuleUrl;
            const request = await requestAsObject(new Request(filenameUrl));
            let ssrFrontmatter;

            await new Promise((resolve, reject) => {
              const worker = new Worker(new URL("../lib/ssr-route-worker.js", import.meta.url));

              worker.on("message", (result) => {
                prerender = result.prerender ?? false;
                isolation = result.isolation ?? isolation;
                hydration = result.hydration ?? hydration;

                if (result.frontmatter) {
                  result.frontmatter.imports = result.frontmatter.imports || [];
                  ssrFrontmatter = result.frontmatter;
                }

                resolve();
              });
              worker.on("error", reject);
              worker.on("exit", (code) => {
                if (code !== 0) {
                  return Promise.reject(new Error(`Worker stopped with exit code ${code}`));
                }
              });

              worker.postMessage({
                executeModuleUrl: routeWorkerUrl.href,
                moduleUrl: filenameUrl.href,
                compilation: JSON.stringify(compilation),
                page: JSON.stringify({
                  servePage: isCustom,
                  route,
                  root,
                  label,
                }),
                request,
                contentOptions: JSON.stringify({
                  frontmatter: true,
                }),
              });
            });

            if (ssrFrontmatter) {
              layout = ssrFrontmatter.layout || layout;
              title = ssrFrontmatter.title || title;
              imports = ssrFrontmatter.imports || imports;
              label = ssrFrontmatter.label || label;
              customData = ssrFrontmatter || customData;
            }
          }

          /*
           * Custom front matter - Variable Definitions
           * --------------------------------------------------
           * collection: the name of the collection for the page (as a string or array)
           * order: the order of this item within the collection
           * tocHeading: heading size to use a Table of Contents for a page
           * tableOfContents: json object containing page's table of contents (list of headings)
           */

          // prune "reserved" attributes that are supported by Greenwood
          [...activeFrontmatterKeys, "layout"].forEach((key) => {
            delete customData[key];
          });

          // set flag whether to gather a list of headings on a page as menu items
          customData.tocHeading = customData.tocHeading || 0;
          customData.tableOfContents = [];

          if (fileContents && customData.tocHeading > 0 && customData.tocHeading <= 6) {
            // parse markdown for table of contents and output to json
            customData.tableOfContents = toc(fileContents).json;

            // parse table of contents for only the pages user wants linked
            if (customData.tableOfContents.length > 0 && customData.tocHeading > 0) {
              customData.tableOfContents = customData.tableOfContents.filter(
                (item) => item.lvl === customData.tocHeading,
              );
            }
          }

          /*
           * Page Properties
           *----------------------
           * id: unique hyphen delimited string of the filename, relative to the pages directory
           * label: Display text for the page inferred, by default is the value of title
           * title: used to customize the <title></title> tag of the page, inferred from the filename
           * route: URL for accessing the page from the browser
           * layout: the custom layout of the page
           * data: custom page frontmatter
           * imports: per page JS or CSS file imports specified from frontmatter
           * resources: all script, style, etc resources for the entire page as URLs
           * outputHref: href to the file in the output folder
           * pageHref: href to the page's filesystem file
           * isSSR: if this is a server side route
           * prerender: if this page should be statically exported
           * isolation: if this page should be run in isolated mode
           * hydration: if this page needs hydration support
           * servePage: signal that this is a custom page file type (static | dynamic)
           */
          const page = {
            id: decodeURIComponent(getIdFromRelativePathPath(relativePagePath, extension)),
            label: decodeURIComponent(label),
            title: title ? decodeURIComponent(title) : title,
            route: `${basePath}${route}`,
            layout,
            data: customData || {},
            imports,
            resources: [],
            pageHref: new URL(relativePagePath, pagesDir).href,
            outputHref:
              route === "/404/"
                ? new URL("./404.html", outputDir).href
                : new URL(`.${route}index.html`, outputDir).href,
            isSSR: isDynamic,
            prerender,
            isolation,
            hydration,
            servePage: isCustom,
          };

          pages.push(page);

          // handle collections
          trackCollectionsForPage(page, compilation.collections); // collections;
        } else {
          console.warn(`Unsupported format detected for page => ${filename}`);
        }
      }
    }

    return { pages, apiRoutes };
  };

  console.debug("building from local sources...");

  // test for SPA
  if (await checkResourceExists(new URL("./index.html", userWorkspace))) {
    graph = [
      {
        ...graph[0],
        pageHref: new URL("./index.html", userWorkspace).href,
        isSPA: true,
      },
    ];
  } else {
    const oldGraph = graph[0];
    const pages = (await checkResourceExists(pagesDir))
      ? await walkDirectoryForPages(pagesDir)
      : { pages: graph, apiRoutes: apis };

    graph = pages.pages;
    apis = pages.apiRoutes;

    const has404Page = graph.find((page) => page.route.endsWith("/404/"));

    // if the _only_ page is a 404 page, still provide a default index.html
    if (has404Page && graph.length === 1) {
      graph = [oldGraph, ...graph];
    } else if (!has404Page) {
      graph = [
        ...graph,
        {
          ...oldGraph,
          id: "404",
          outputHref: new URL("./404.html", outputDir).href,
          pageHref: new URL("./404.html", pagesDir).href,
          route: `${basePath}/404/`,
          path: "404.html",
          label: "Not Found",
          title: "Page Not Found",
        },
      ];
    }
  }

  const sourcePlugins = compilation.config.plugins.filter((plugin) => plugin.type === "source");

  // make sure this assignment happens before plugins run
  // to allow plugins access to current graph
  compilation.graph = graph;
  compilation.manifest = { apis };

  if (sourcePlugins.length > 0) {
    console.debug("building from external sources...");
    for (const plugin of sourcePlugins) {
      const instance = plugin.provider(compilation);
      const data = await instance();

      for (const node of data) {
        const { body, route } = node;

        if (!body || !route) {
          const missingKey = !body ? "body" : "route";

          return Promise.reject(`ERROR: provided node does not provide a ${missingKey} property.`);
        }

        const page = {
          pageHref: null,
          imports: [],
          resources: [],
          outputHref: new URL(`.${route}index.html`, outputDir).href,
          ...node,
          route: encodeURIComponent(route).replace(/%2F/g, "/"),
          data: {
            ...node.data,
            collection: node.collection ?? "",
          },
          external: true,
        };

        graph.push(page);

        trackCollectionsForPage(page, compilation.collections);
      }
    }
  }

  return Promise.resolve(compilation);
};

export { generateGraph };
