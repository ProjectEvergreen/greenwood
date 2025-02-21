import fs from "fs/promises";
import * as htmlparser from "node-html-parser";
import { checkResourceExists } from "./resource-utils.js";
import { Worker } from "worker_threads";
import { asyncFilter } from "./async-utils.js";

async function getCustomPageLayoutsFromPlugins(compilation, layoutName) {
  const contextPlugins = compilation.config.plugins
    .filter((plugin) => {
      return plugin.type === "context";
    })
    .map((plugin) => {
      return plugin.provider(compilation);
    });

  const customLayoutLocations = [];
  const layoutDir = contextPlugins.map((plugin) => plugin.layouts).flat();

  for (const layoutDirUrl of layoutDir) {
    if (layoutName) {
      const layoutUrl = new URL(`./${layoutName}.html`, layoutDirUrl);

      if (await checkResourceExists(layoutUrl)) {
        customLayoutLocations.push(layoutUrl);
      }
    }
  }

  return customLayoutLocations;
}

async function getPageLayout(pageHref = "", compilation, layout) {
  const { config, context } = compilation;
  const { layoutsDir, userLayoutsDir, pagesDir } = context;
  const filePathUrl = pageHref && pageHref !== "" ? new URL(pageHref) : pageHref;
  const customPageFormatPlugins = config.plugins
    .filter((plugin) => plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin)
    .map((plugin) => plugin.provider(compilation));
  const isCustomStaticPage =
    customPageFormatPlugins[0] &&
    customPageFormatPlugins[0].servePage === "static" &&
    customPageFormatPlugins[0].shouldServe &&
    (await customPageFormatPlugins[0].shouldServe(filePathUrl));
  const customPluginDefaultPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, "page");
  const customPluginPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, layout);
  const extension = pageHref?.split(".")?.pop();
  const is404Page = pageHref?.endsWith("404.html") && extension === "html";
  const hasCustomStaticLayout = await checkResourceExists(
    new URL(`./${layout}.html`, userLayoutsDir),
  );
  const hasCustomDynamicLayout = await checkResourceExists(
    new URL(`./${layout}.js`, userLayoutsDir),
  );
  const hasPageLayout = await checkResourceExists(new URL("./page.html", userLayoutsDir));
  const hasCustom404Page = await checkResourceExists(new URL("./404.html", pagesDir));
  const isHtmlPage = extension === "html" && (await checkResourceExists(new URL(pageHref)));
  let contents;

  if (layout && (customPluginPageLayouts.length > 0 || hasCustomStaticLayout)) {
    // use a custom layout, usually from markdown frontmatter
    contents =
      customPluginPageLayouts.length > 0
        ? await fs.readFile(new URL(`./${layout}.html`, customPluginPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL(`./${layout}.html`, userLayoutsDir), "utf-8");
  } else if (isHtmlPage) {
    // if the page is already HTML, use that as the layout, NOT accounting for 404 pages
    contents = await fs.readFile(filePathUrl, "utf-8");
  } else if (isCustomStaticPage) {
    // transform, then use that as the layout, NOT accounting for 404 pages
    const transformed = await customPageFormatPlugins[0].serve(filePathUrl);
    contents = await transformed.text();
  } else if (customPluginDefaultPageLayouts.length > 0 || (!is404Page && hasPageLayout)) {
    // else look for default page layout from the user
    // and 404 pages should be their own "top level" layout
    contents =
      customPluginDefaultPageLayouts.length > 0
        ? await fs.readFile(new URL("./page.html", customPluginDefaultPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL("./page.html", userLayoutsDir), "utf-8");
  } else if (hasCustomDynamicLayout && !is404Page) {
    const routeModuleLocationUrl = new URL(`./${layout}.js`, userLayoutsDir);
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        if (result.body) {
          contents = result.body;
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
        compilation: JSON.stringify(compilation),
      });
    });
  } else if (is404Page && !hasCustom404Page) {
    contents = await fs.readFile(new URL("./404.html", layoutsDir), "utf-8");
  } else {
    // fallback to using Greenwood's stock page layout
    contents = await fs.readFile(new URL("./page.html", layoutsDir), "utf-8");
  }

  return contents;
}

async function getAppLayout(pageLayoutContents, compilation, customImports = [], matchingRoute) {
  const activeFrontmatterTitleKey = "${globalThis.page.title}";
  const enableHud = compilation.config.devServer.hud;
  const { layoutsDir, userLayoutsDir } = compilation.context;
  const userStaticAppLayoutUrl = new URL("./app.html", userLayoutsDir);
  const userDynamicAppLayoutUrl = new URL("./app.js", userLayoutsDir);
  const userHasStaticAppLayout = await checkResourceExists(userStaticAppLayoutUrl);
  const userHasDynamicAppLayout = await checkResourceExists(userDynamicAppLayoutUrl);
  const customAppLayoutsFromPlugins = await getCustomPageLayoutsFromPlugins(compilation, "app");
  let dynamicAppLayoutContents;

  if (userHasDynamicAppLayout) {
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        if (result.body) {
          dynamicAppLayoutContents = result.body;
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
        moduleUrl: userDynamicAppLayoutUrl.href,
        compilation: JSON.stringify(compilation),
      });
    });
  }

  let appLayoutContents =
    customAppLayoutsFromPlugins.length > 0
      ? await fs.readFile(new URL("./app.html", customAppLayoutsFromPlugins[0]))
      : userHasStaticAppLayout
        ? await fs.readFile(userStaticAppLayoutUrl, "utf-8")
        : userHasDynamicAppLayout
          ? dynamicAppLayoutContents
          : await fs.readFile(new URL("./app.html", layoutsDir), "utf-8");
  let mergedLayoutContents = "";

  const pageRoot =
    pageLayoutContents &&
    htmlparser.parse(pageLayoutContents, {
      script: true,
      style: true,
      noscript: true,
      pre: true,
    });
  const appRoot = htmlparser.parse(appLayoutContents, {
    script: true,
    style: true,
  });

  if ((pageLayoutContents && !pageRoot.valid) || !appRoot.valid) {
    console.debug("ERROR: Invalid HTML detected");
    const invalidContents = !pageRoot.valid ? pageLayoutContents : appLayoutContents;

    if (enableHud) {
      appLayoutContents = appLayoutContents.replace(
        "<body>",
        `
        <body>
          <div style="position: absolute; width: auto; border: dotted 3px red; background-color: white; opacity: 0.75; padding: 1% 1% 0">
            <p>Malformed HTML detected, please check your closing tags or an <a href="https://www.google.com/search?q=html+formatter" target="_blank" rel="noreferrer">HTML formatter</a>.</p>
            <details>
              <pre>
                ${invalidContents.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}
              </pre>
            </details>
          </div>
      `,
      );
    }

    mergedLayoutContents = appLayoutContents.replace(/<page-outlet><\/page-outlet>/, "");
  } else {
    const appTitle = appRoot ? appRoot.querySelector("head title") : null;
    const appBody = appRoot.querySelector("body") ? appRoot.querySelector("body").innerHTML : "";
    const pageBody =
      pageRoot && pageRoot.querySelector("body") ? pageRoot.querySelector("body").innerHTML : "";
    const pageTitle = pageRoot && pageRoot.querySelector("head title");
    const hasActiveFrontmatterTitle =
      compilation.config.activeContent &&
      ((pageTitle && pageTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0) ||
        (appTitle && appTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0));
    const resourcePlugins = compilation.config.plugins
      .filter((plugin) => {
        return plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin;
      })
      .map((plugin) => {
        return plugin.provider(compilation);
      });
    let title;

    if (hasActiveFrontmatterTitle) {
      const text =
        pageTitle && pageTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0
          ? pageTitle.rawText
          : appTitle.rawText;

      title = text.replace(activeFrontmatterTitleKey, matchingRoute.title || matchingRoute.label);
    } else {
      title = matchingRoute.title
        ? matchingRoute.title
        : pageTitle && pageTitle.rawText
          ? pageTitle.rawText
          : appTitle && appTitle.rawText
            ? appTitle.rawText
            : matchingRoute.label;
    }

    const mergedHtml =
      pageRoot && pageRoot.querySelector("html") && pageRoot.querySelector("html")?.rawAttrs !== ""
        ? `<html ${pageRoot.querySelector("html").rawAttrs}>`
        : appRoot && appRoot.querySelector("html") && appRoot.querySelector("html")?.rawAttrs !== ""
          ? `<html ${appRoot.querySelector("html").rawAttrs}>`
          : "<html>";

    const mergedMeta = [
      ...appRoot.querySelectorAll("head meta"),
      ...[...((pageRoot && pageRoot.querySelectorAll("head meta")) || [])],
    ].join("\n");

    const mergedLinks = [
      ...appRoot.querySelectorAll("head link"),
      ...[...((pageRoot && pageRoot.querySelectorAll("head link")) || [])],
    ].join("\n");

    const mergedStyles = [
      ...appRoot.querySelectorAll("head style"),
      ...[...((pageRoot && pageRoot.querySelectorAll("head style")) || [])],
      ...(
        await asyncFilter(customImports, async (resource) => {
          const [href] = resource.split(" ");
          const isCssFile = href.split(" ")[0].split(".").pop() === "css";

          if (isCssFile) {
            return true;
          }

          const resourceUrl = new URL(`file://${href}`);
          const request = new Request(resourceUrl, { headers: { Accept: "text/css" } });
          let isSupportedCustomFormat = false;

          for (const plugin of resourcePlugins) {
            if (plugin.shouldServe && (await plugin.shouldServe(resourceUrl, request))) {
              isSupportedCustomFormat = true;
              break;
            }
          }

          return isSupportedCustomFormat;
        })
      ).map((resource) => {
        const [href, ...attributes] = resource.split(" ");
        const attrs = attributes?.length > 0 ? attributes.join(" ") : "";

        return `<link rel="stylesheet" href="${href}" ${attrs}></link>`;
      }),
    ].join("\n");

    const mergedScripts = [
      ...appRoot.querySelectorAll("head script"),
      ...[...((pageRoot && pageRoot.querySelectorAll("head script")) || [])],
      ...(
        await asyncFilter(customImports, async (resource) => {
          const [src] = resource.split(" ");
          const isJavaScriptFile = src.split(" ")[0].split(".").pop() === "js";

          if (isJavaScriptFile) {
            return true;
          }

          const resourceUrl = new URL(`file://${src}`);
          const request = new Request(resourceUrl, { headers: { Accept: "text/javascript" } });
          let isSupportedCustomFormat = false;

          for (const plugin of resourcePlugins) {
            if (plugin.shouldServe && (await plugin.shouldServe(resourceUrl, request))) {
              isSupportedCustomFormat = true;
              break;
            }
          }

          return isSupportedCustomFormat;
        })
      ).map((resource) => {
        const [src, ...attributes] = resource.split(" ");
        const attrs = attributes?.length > 0 ? attributes.join(" ") : "";

        return `<script src="${src}" ${attrs}></script>`;
      }),
    ].join("\n");

    const finalBody = pageLayoutContents
      ? appBody.replace(/<page-outlet><\/page-outlet>/, pageBody)
      : appBody;

    mergedLayoutContents = `<!DOCTYPE html>
      ${mergedHtml}
        <head>
          <title>${title}</title>
          ${mergedMeta}
          ${mergedLinks}
          ${mergedStyles}
          ${mergedScripts}
        </head>
        <body>
          ${finalBody}
        </body>
      </html>
    `;
  }

  return mergedLayoutContents;
}

async function getUserScripts(contents, compilation) {
  const { config } = compilation;

  contents = contents.replace(
    "<head>",
    `
    <head>
      <script data-gwd="base-path">
        globalThis.__GWD_BASE_PATH__ = '${config.basePath}';
      </script>
  `,
  );

  return contents;
}

export { getAppLayout, getPageLayout, getUserScripts };
