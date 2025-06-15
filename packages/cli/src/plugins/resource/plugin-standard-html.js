// @ts-nocheck
/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import fs from "fs/promises";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { getPageLayout, getAppLayout, getGreenwoodScripts } from "../../lib/layout-utils.js";
import { requestAsObject, checkResourceExists } from "../../lib/resource-utils.js";
import { unified } from "unified";
import { Worker } from "worker_threads";
import { parse as htmlparser } from "node-html-parser";

class StandardHtmlResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = [".html", ".md"];
    this.contentType = "text/html";
  }

  async shouldServe(url, request) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);
    const isSPA = this.compilation.graph.find((node) => node.isSPA) && pathname.indexOf(".") < 0;

    return (
      protocol.startsWith("http") &&
      (hasMatchingPageRoute || (isSPA && request.headers.get("Accept").indexOf("text/html") >= 0))
    );
  }

  async serve(url, request) {
    const { config, context } = this.compilation;
    const { userWorkspace, pagesDir, layoutsDir } = context;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph.find((node) => node.isSPA);
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};
    const { pageHref } = matchingRoute;
    const filePath =
      !matchingRoute.external && pageHref
        ? new URL(pageHref).pathname.replace(userWorkspace.pathname, "./")
        : "";
    const isMarkdownContent = (filePath || "").split(".").pop() === "md";
    const isHtmlContent = (filePath || "").split(".").pop() === "html";
    let body = "";
    let ssrBody;
    let ssrLayout;
    let processedMarkdown = null;
    let html = "";

    // TODO get all _page_ contents up-front to _pass_ into layout utils
    if (isMarkdownContent) {
      const markdownContents = await fs.readFile(new URL(pageHref), "utf-8");
      const rehypePlugins = [];
      const remarkPlugins = [];

      for (const plugin of config.markdown.plugins) {
        const name = typeof plugin === "string" ? plugin : plugin.name;
        const options = plugin?.options ?? null;
        const pluginTypeArray = name.indexOf("rehype-") >= 0 ? rehypePlugins : remarkPlugins;
        const pluginImport = (await import(name)).default;

        if (options) {
          pluginTypeArray.push([pluginImport, options]);
        } else {
          pluginTypeArray.push(pluginImport);
        }
      }

      processedMarkdown = await unified()
        .use(remarkParse) // parse markdown into AST
        .use(remarkFrontmatter) // extract frontmatter from AST
        .use(remarkPlugins) // apply userland remark plugins
        .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
        .use(rehypeRaw) // support mixed HTML in markdown
        .use(rehypePlugins) // apply userland rehype plugins
        .use(rehypeStringify) // convert AST to HTML string
        .process(markdownContents);
    } else if (isHtmlContent && !matchingRoute.route.endsWith("/404/")) {
      // TODO better way to handle 404 graphing
      body = await fs.readFile(new URL(matchingRoute.pageHref), "utf-8");
    } else if (isHtmlContent && matchingRoute.route.endsWith("/404/")) {
      const pathUrl = (await checkResourceExists(new URL("./404.html", pagesDir)))
        ? new URL("./404.html", pagesDir)
        : new URL("./404.html", layoutsDir);

      body = await fs.readFile(pathUrl, "utf-8");
    } else if (matchingRoute.isSSR) {
      const routeModuleLocationUrl = new URL(pageHref);
      const routeWorkerUrl = this.compilation.config.plugins
        .find((plugin) => plugin.type === "renderer")
        .provider().executeModuleUrl;
      const req = await requestAsObject(request);

      await new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../../lib/ssr-route-worker.js", import.meta.url));

        worker.on("message", (result) => {
          if (result.layout) {
            ssrLayout = result.layout;
          }

          if (result.body) {
            ssrBody = result.body;
          }
          resolve();
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        worker.postMessage({
          executeModuleUrl: routeWorkerUrl.href,
          moduleUrl: routeModuleLocationUrl.href,
          compilation: JSON.stringify(this.compilation),
          page: JSON.stringify(matchingRoute),
          request: req,
        });
      });
    }

    if (processedMarkdown) {
      const wrappedCustomElementRegex =
        /<p><[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)><\/p>/g;
      const ceTest = wrappedCustomElementRegex.test(processedMarkdown.value);

      if (ceTest) {
        const ceMatches = processedMarkdown.value.match(wrappedCustomElementRegex);

        ceMatches.forEach((match) => {
          const stripWrappingTags = match.replace("<p>", "").replace("</p>", "");

          processedMarkdown.value = processedMarkdown.value.replace(match, stripWrappingTags);
        });
      }

      // https://github.com/ProjectEvergreen/greenwood/issues/1126
      body = processedMarkdown.value.replace(/\$/g, "$$$");
      //   /<content-outlet>(.*)<\/content-outlet>/s,
      //   processedMarkdown.value.replace(/\$/g, "$$$"),
      // );
    } else if (matchingRoute.external) {
      body = matchingRoute.body;
      // body = body.replace(/<content-outlet>(.*)<\/content-outlet>/s, matchingRoute.body);
    } else if (ssrBody) {
      body = `<!-- greenwood-ssr-start -->${ssrBody.replace(/\$/g, "$$$")}<!-- greenwood-ssr-end -->`;
      // body = body.replace(
      //   /<content-outlet>(.*)<\/content-outlet>/s,
      //   `<!-- greenwood-ssr-start -->${ssrBody.replace(/\$/g, "$$$")}<!-- greenwood-ssr-end -->`,
      // );
    }

    // console.log('111', { ssrBody, body });
    if (isSpaRoute) {
      html = await fs.readFile(new URL(isSpaRoute.pageHref), "utf-8");
    } else {
      // body = await getPageLayout(pageHref, this.compilation, layout, body, ssrLayout);
      // TODO if SSR layout, use that instead for page layout

      /*
       * merging logic?
       *
       * page (with contents + html / head / body tags)
       * page layout (with content-outlet)
       * app layout (with page-outlet)
       * active frontmatter...
       *
       * who does the swapping...?
       */

      // TODO can we get away from passing in matching route?
      const mergedPageLayoutContents = await getPageLayout(
        body,
        this.compilation,
        matchingRoute,
        ssrLayout,
      );
      console.log({ mergedPageLayoutContents });

      const mergedAppLayoutContents = await getAppLayout(
        mergedPageLayoutContents,
        this.compilation,
        matchingRoute,
      );
      console.log({ mergedAppLayoutContents });

      html = mergedAppLayoutContents;
    }

    // TODO should this get nested after getPageLayout?
    // body = await getAppLayout(body, this.compilation, customImports, matchingRoute);
    console.log("PRE HTML", { html });
    html = await getGreenwoodScripts(html, this.compilation);

    // TODO do we even want this?
    // https://github.com/ProjectEvergreen/greenwood/issues/1271
    // clean up any empty placeholder content-outlet
    if (html.indexOf("<content-outlet></content-outlet>") > 0) {
      html = html.replace("<content-outlet></content-outlet>", "");
    }

    console.log("FINAL HTML", { html });

    return new Response(html, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }

  async shouldOptimize(url, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    const { optimization, basePath } = this.compilation.config;
    const { pathname } = url;
    const pageResources = this.compilation.graph.find((page) => page.route === pathname).resources;
    let body = await response.text();

    const root = htmlparser(body, {
      blockTextElements: {
        script: true,
        style: true,
      },
    });

    for (const pageResource of pageResources) {
      const keyedResource = this.compilation.resources.get(pageResource);
      const { contents, src, type, optimizationAttr, optimizedFileContents, optimizedFileName } =
        keyedResource;

      if (src) {
        if (type === "script") {
          const tag = root
            .querySelectorAll("script")
            .find((script) => script.getAttribute("src") === src);

          if (!optimizationAttr && (optimization === "default" || optimization === "none")) {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace(
              "<head>",
              `
              <head>
              <link rel="modulepreload" href="${optimizedFilePath}" as="script">
            `,
            );
          } else if (optimizationAttr === "inline" || optimization === "inline") {
            const isModule = tag.rawAttrs.indexOf('type="module') >= 0 ? ' type="module"' : "";

            body = body.replace(
              `<script ${tag.rawAttrs}></script>`,
              `
              <script ${isModule}>
                ${optimizedFileContents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$")}
              </script>
            `,
            );
          } else if (optimizationAttr === "static" || optimization === "static") {
            body = body.replace(`<script ${tag.rawAttrs}></script>`, "");
          }
        } else if (type === "link") {
          const tag = root
            .querySelectorAll("link")
            .find((link) => link.getAttribute("href") === src);

          if (optimizationAttr !== "inline" && optimization !== "inline") {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace(
              "<head>",
              `
              <head>
              <link rel="preload" href="${optimizedFilePath}" as="style" crossorigin="anonymous"></link>
            `,
            );
          } else if (optimizationAttr === "inline" || optimization === "inline") {
            // https://github.com/ProjectEvergreen/greenwood/issues/810
            // when pre-rendering, puppeteer normalizes everything to <link .../>
            // but if not using pre-rendering, then it could come out as <link ...></link>
            // not great, but best we can do for now until #742
            body = body
              .replace(
                `<link ${tag.rawAttrs}>`,
                `
              <style>
                ${optimizedFileContents}
              </style>
            `,
              )
              .replace(
                `<link ${tag.rawAttrs}/>`,
                `
              <style>
                ${optimizedFileContents}
              </style>
            `,
              );
          }
        }
      } else {
        if (type === "script") {
          const tag = root
            .querySelectorAll("script")
            .find((script) => script.innerHTML === contents);

          if (optimizationAttr === "static" || optimization === "static") {
            body = body.replace(
              `<script ${tag.rawAttrs}>${contents.replace(/\.\//g, "/").replace(/\$/g, "$$$")}</script>`,
              "",
            );
          } else if (optimizationAttr === "none") {
            body = body.replace(
              contents,
              contents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$"),
            );
          } else {
            body = body.replace(
              contents,
              optimizedFileContents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$"),
            );
          }
        } else if (type === "style") {
          body = body.replace(contents, optimizedFileContents);
        }
      }
    }

    return new Response(body);
  }
}

const greenwoodPluginStandardHtml = {
  type: "resource",
  name: "plugin-standard-html",
  provider: (compilation) => new StandardHtmlResource(compilation),
};

export { greenwoodPluginStandardHtml };
