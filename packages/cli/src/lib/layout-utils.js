import fs from "node:fs/promises";
import { parse, valid } from "node-html-parser";
import { checkResourceExists } from "./resource-utils.js";
import { Worker } from "node:worker_threads";
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

/*
 *
 * This function merges the contents of pages and page / app layouts,
 * It favors the contents of the child over the parent, allowing content
 * closer to the page to "bubble" up to the top.
 *
 * For example, a page title will be prioritized over a page layout title
 * and a page template title would be prioritized over an app layout title
 *
 */
async function mergeContentIntoLayout(
  outletType,
  parentContents,
  childContents,
  compilation,
  matchingRoute,
) {
  const activeFrontmatterTitleKey = "${globalThis.page.title}";
  // keep comments, especially for SSR placeholder markers
  const parentRoot = parentContents && parse(parentContents, { comment: true });
  const childRoot = parse(childContents, { comment: true });
  let mergedContents = "";

  if ((parentContents && !valid(parentContents)) || (childContents && !valid(childContents))) {
    console.error(`ERROR: Invalid HTML detected for route => ${matchingRoute.route}`);
    const enableHud = compilation.config.devServer.hud;

    if (process.env.__GWD_COMMAND__ === "develop" && enableHud) {
      const invalidContents =
        parentContents && !valid(parentContents) ? parentContents : childContents;
      const validContents = valid(childContents)
        ? childContents
        : (parentContents ?? `<html><body></body></html>`);

      mergedContents = validContents.replace(
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
  } else {
    // only merge custom page imports if we are handling a page into a layout to not duplication entries in the final HTML
    const customImports = outletType === "content" ? (matchingRoute?.imports ?? []) : [];

    const parentTitle = parentRoot ? parentRoot.querySelector("head title") : null;
    const parentBody =
      parentRoot && parentRoot.querySelector("body")
        ? parentRoot.querySelector("body").innerHTML
        : undefined;
    const childBody =
      childRoot && childRoot.querySelector("body")
        ? childRoot.querySelector("body").innerHTML
        : undefined;
    const childTitle = childRoot && childRoot.querySelector("head title");
    const hasActiveFrontmatterTitle =
      compilation.config.activeContent &&
      ((childTitle && childTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0) ||
        (parentTitle && parentTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0));
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
        childTitle && childTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0
          ? childTitle.rawText
          : parentTitle.rawText;
      title = text.replace(activeFrontmatterTitleKey, matchingRoute.title || matchingRoute.label);
    } else {
      // we favor frontmatter title for the page
      // otherwise we defer to page layouts and then ultimately the app layout
      title =
        outletType === "content" && matchingRoute?.title
          ? matchingRoute.title
          : childTitle && childTitle.rawText
            ? childTitle.rawText
            : parentTitle && parentTitle.rawText
              ? parentTitle.rawText
              : "";
    }

    const mergedHtml =
      childRoot &&
      childRoot.querySelector("html") &&
      childRoot.querySelector("html")?.rawAttrs !== ""
        ? `<html ${childRoot.querySelector("html").rawAttrs}>`
        : parentRoot &&
            parentRoot.querySelector("html") &&
            parentRoot.querySelector("html")?.rawAttrs !== ""
          ? `<html ${parentRoot.querySelector("html").rawAttrs}>`
          : "<html>";

    const mergedMeta = [
      ...((parentRoot && parentRoot?.querySelectorAll("head meta")) ?? []),
      ...[...((childRoot && childRoot.querySelectorAll("head meta")) || [])],
    ].join("\n");

    const mergedLinks = [
      ...((parentRoot && parentRoot?.querySelectorAll("head link")) ?? []),
      ...[...((childRoot && childRoot.querySelectorAll("head link")) || [])],
    ].join("\n");

    const mergedStyles = [
      ...((parentRoot && parentRoot?.querySelectorAll("head style")) ?? []),
      ...[...((childRoot && childRoot.querySelectorAll("head style")) || [])],
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
      ...((parentRoot && parentRoot?.querySelectorAll("head script")) || []),
      ...[...((childRoot && childRoot.querySelectorAll("head script")) || [])],
      ...(
        await asyncFilter(customImports, async (resource) => {
          const [src] = resource.split(" ");
          const isSupportedScript = ["js", "ts"].includes(src.split(" ")[0].split(".").pop());

          if (isSupportedScript) {
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

    const outletRegex =
      outletType === "content"
        ? /<content-outlet><\/content-outlet>/
        : /<page-outlet><\/page-outlet>/;
    // we need to make sure that if parent layouts don't have an "outlet" tag
    // then we _do not_ favor the child contents in that case
    // this can happen in the case of context plugins in which pages may _only_ be used for loading a layout
    // https://github.com/ProjectEvergreen/greenwood/pull/1527
    const finalBody =
      parentBody && parentBody.match(outletRegex)
        ? parentBody.replace(outletRegex, childBody ?? childContents)
        : parentContents && parentContents.match(outletRegex) && outletType === "content"
          ? parentContents.replace(outletRegex, childBody ?? childContents)
          : parentBody
            ? parentBody
            : childRoot.querySelector("html") && childBody
              ? childBody
              : !childRoot.querySelector("html")
                ? childContents
                : "";

    mergedContents = `<!DOCTYPE html>
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

  return mergedContents;
}

// merges provided page content into a page layout
// optionally using an already acquired SSR layout to avoid executing an SSR route worker
async function getPageLayout(pageContents, compilation, matchingRoute) {
  const { context } = compilation;
  const { layoutsDir } = context;
  const { layout, pageHref } = matchingRoute;
  const customPluginDefaultPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, "page");
  const customPluginPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, layout);
  const hasCustomStaticLayout = await checkResourceExists(new URL(`./${layout}.html`, layoutsDir));
  const hasCustomDynamicLayout = await checkResourceExists(new URL(`./${layout}.js`, layoutsDir));
  const hasCustomDynamicTypeScriptLayout = await checkResourceExists(
    new URL(`./${layout}.ts`, layoutsDir),
  );
  const hasPageLayout = await checkResourceExists(new URL("./page.html", layoutsDir));

  let layoutContents;

  if (layout && (customPluginPageLayouts.length > 0 || hasCustomStaticLayout)) {
    // has a custom layout from markdown frontmatter or context plugin
    layoutContents =
      customPluginPageLayouts.length > 0
        ? await fs.readFile(customPluginPageLayouts[0], "utf-8")
        : await fs.readFile(new URL(`./${layout}.html`, layoutsDir), "utf-8");
  } else if (customPluginDefaultPageLayouts.length > 0 || hasPageLayout) {
    // has a dynamic default page layout from context plugin
    layoutContents =
      customPluginDefaultPageLayouts.length > 0
        ? await fs.readFile(new URL("./page.html", customPluginDefaultPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL("./page.html", layoutsDir), "utf-8");
  } else if (hasCustomDynamicLayout || hasCustomDynamicTypeScriptLayout || matchingRoute.isSSR) {
    // has a dynamic page layout
    const routeModuleLocationUrl = hasCustomDynamicLayout
      ? new URL(`./${layout}.js`, layoutsDir)
      : hasCustomDynamicTypeScriptLayout
        ? new URL(`./${layout}.ts`, layoutsDir)
        : new URL(pageHref);
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    await new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        if (result.layout) {
          layoutContents = result.layout;
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
        contentOptions: JSON.stringify({
          layout: true,
        }),
        page: JSON.stringify(matchingRoute),
      });
    });
  }

  const mergedContents = await mergeContentIntoLayout(
    "content",
    layoutContents,
    pageContents,
    compilation,
    matchingRoute,
  );

  return mergedContents;
}

// merges provided page + app layout contents into an app level layout
async function getAppLayout(pageLayoutContents, compilation, matchingRoute) {
  const { layoutsDir } = compilation.context;
  const userStaticAppLayoutUrl = new URL("./app.html", layoutsDir);
  const userDynamicAppLayoutUrl = new URL("./app.js", layoutsDir);
  const userDynamicAppLayoutTypeScriptUrl = new URL("./app.ts", layoutsDir);
  const userHasStaticAppLayout = await checkResourceExists(userStaticAppLayoutUrl);
  const userHasDynamicAppLayout = await checkResourceExists(userDynamicAppLayoutUrl);
  const userHasDynamicAppTypeScriptLayout = await checkResourceExists(
    userDynamicAppLayoutTypeScriptUrl,
  );
  const customAppLayoutsFromPlugins = await getCustomPageLayoutsFromPlugins(compilation, "app");
  let dynamicAppLayoutContents;

  if (userHasDynamicAppLayout || userHasDynamicAppTypeScriptLayout) {
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    await new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        // result.body if it is an SSR custom element page layout, e.g. default export
        // result.layout if it is a getLayout call
        dynamicAppLayoutContents = result.body ?? result.layout;
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
        moduleUrl: userHasDynamicAppLayout
          ? userDynamicAppLayoutUrl.href
          : userDynamicAppLayoutTypeScriptUrl.href,
        compilation: JSON.stringify(compilation),
        contentOptions: JSON.stringify({
          layout: true,
          body: true,
        }),
      });
    });
  }

  let appLayoutContents =
    customAppLayoutsFromPlugins.length > 0
      ? await fs.readFile(new URL("./app.html", customAppLayoutsFromPlugins[0]), "utf-8")
      : userHasStaticAppLayout
        ? await fs.readFile(userStaticAppLayoutUrl, "utf-8")
        : userHasDynamicAppLayout || userHasDynamicAppTypeScriptLayout
          ? dynamicAppLayoutContents
          : "";
  let mergedLayoutContents = "";

  mergedLayoutContents = await mergeContentIntoLayout(
    "page",
    appLayoutContents,
    pageLayoutContents,
    compilation,
    matchingRoute,
  );

  return mergedLayoutContents;
}

async function getGreenwoodScripts(contents, compilation) {
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

export { getAppLayout, getPageLayout, getGreenwoodScripts };
