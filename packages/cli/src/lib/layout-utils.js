// @ts-nocheck
import fs from "fs/promises";
import htmlparser from "node-html-parser";
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

async function getPageLayout(pageHref = "", compilation, layout, pageContents = "", layoutContents) {
  console.log('getPageLayout ???', { pageHref, layout, pageContents, layoutContents });
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
  const hasCustomDynamicTypeScriptLayout = await checkResourceExists(
    new URL(`./${layout}.ts`, userLayoutsDir),
  );
  const hasPageLayout = await checkResourceExists(new URL("./page.html", userLayoutsDir));
  const hasCustom404Page = await checkResourceExists(new URL("./404.html", pagesDir));
  // const isHtmlPage = extension === "html" && (await checkResourceExists(new URL(pageHref)));
  let mergedContents = "";

  console.log({ is404Page, hasCustom404Page, pageHref, layout, hasCustomStaticLayout, hasCustomDynamicLayout, hasCustomDynamicTypeScriptLayout });
  // TODO document all these conditions
  if (layout && (customPluginPageLayouts.length > 0 || hasCustomStaticLayout)) {
    console.log('hasCustomStaticLayout / customPluginPageLayouts / layout', { pageHref, layout });
    // use a custom layout, usually from markdown frontmatter
    mergedContents =
      customPluginPageLayouts.length > 0
        ? await fs.readFile(new URL(`./${layout}.html`, customPluginPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL(`./${layout}.html`, userLayoutsDir), "utf-8");
  } else if (isCustomStaticPage) {
    // console.log('isCustomStaticPage (e.g. context plugin', { pageHref, layout });
    // transform, then use that as the layout, NOT accounting for 404 pages
    const transformed = await customPageFormatPlugins[0].serve(filePathUrl);
    mergedContents = await transformed.text();
  } else if (customPluginDefaultPageLayouts.length > 0 || (!is404Page && hasPageLayout)) {
    // console.log('HAS LAYOUT customPluginDefaultPageLayouts', { pageHref, layout });
    // else look for default page layout from the user
    // and 404 pages should be their own "top level" layout
    mergedContents =
      customPluginDefaultPageLayouts.length > 0
        ? await fs.readFile(new URL("./page.html", customPluginDefaultPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL("./page.html", userLayoutsDir), "utf-8");
  } else if(layoutContents) {
    // console.log('HAS LAYOUT CONTENTS', { pageHref, layout });
    mergedContents = layoutContents;
  } else if ((hasCustomDynamicLayout || hasCustomDynamicTypeScriptLayout) && !is404Page && !layoutContents) {
    // console.log('CUSTOM DYNAMIC LAYOUTS', { pageHref, layout });
    const routeModuleLocationUrl = hasCustomDynamicLayout
      ? new URL(`./${layout}.js`, userLayoutsDir)
      : new URL(`./${layout}.ts`, userLayoutsDir);
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    await new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        if (result.body) {
          mergedContents = result.body;
          console.log('SSR layout', { pageHref, mergedContents });
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
    // TODO 404 page should come from html plugin
    mergedContents = await fs.readFile(new URL("./404.html", layoutsDir), "utf-8");
  } else {
    // fallback to using Greenwood's stock page layout
    mergedContents = await fs.readFile(new URL("./page.html", layoutsDir), "utf-8");
  }

  if (pageContents !== "") {
    console.log('SWAP out pageContents with layout', { pageHref, mergedContents, pageContents });
    // handle HTML pages with a custom frontmatter layout
    // TODO need to merge inner <head> / <body> tags?
    mergedContents = mergedContents.replace(
      /<content-outlet>(.*)<\/content-outlet>/s,
      pageContents.replace(/\$/g, "$$$"),
    );
  } else if(layoutContents) {
    mergedContents = layoutContents.replace(
      /<content-outlet>(.*)<\/content-outlet>/s,
      mergedContents.replace(/\$/g, "$$$"),
    );
  }

  console.log('FINAL!!!', { pageHref, pageContents, mergedContents });

  return mergedContents;
}

async function getAppLayout(pageLayoutContents, compilation, customImports = [], matchingRoute) {
  const activeFrontmatterTitleKey = "${globalThis.page.title}";
  const enableHud = compilation.config.devServer.hud;
  const { layoutsDir, userLayoutsDir } = compilation.context;
  const userStaticAppLayoutUrl = new URL("./app.html", userLayoutsDir);
  const userDynamicAppLayoutUrl = new URL("./app.js", userLayoutsDir);
  const userDynamicAppLayoutTypeScriptUrl = new URL("./app.ts", userLayoutsDir);
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
        moduleUrl: userHasDynamicAppLayout
          ? userDynamicAppLayoutUrl.href
          : userDynamicAppLayoutTypeScriptUrl.href,
        compilation: JSON.stringify(compilation),
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
          : await fs.readFile(new URL("./app.html", layoutsDir), "utf-8");
  let mergedLayoutContents = "";

  const pageRoot =
    pageLayoutContents &&
    htmlparser.parse(pageLayoutContents, {
      comment: matchingRoute.isSSR,
      script: true,
      style: true,
      noscript: true,
      pre: true,
    });
  const appRoot = htmlparser.parse(appLayoutContents, {
    comment: matchingRoute.isSSR,
    script: true,
    style: true,
    noscript: true,
    pre: true,
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

    const finalBody = pageLayoutContents
      ? appBody.replace(/<page-outlet><\/page-outlet>/, pageBody)
      : appBody;

    // console.log({ appBody, finalBody })
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

// TODO rename appRoot to parentRoot, and pageRoot to childRoot
// TODO are we duplicating customImports processing logic?
// TODO document this function and params
// TODO do we absolutely need to pass matchingRoute?
async function mergeContentIntoLayout(outletType, pageContents, layoutContents, compilation, matchingRoute) {
  // TODO active frontmatter handling
  console.log('MERGE LAYOUT CONTENTS @@@@', { pageContents, layoutContents });
  const activeFrontmatterTitleKey = "${globalThis.page.title}";
  const hasActiveFrontmatterTitle = false;
  const layoutRoot = htmlparser.parse(layoutContents, {
    comment: true,
    script: true,
    style: true,
    noscript: true,
    pre: true,
  });
  const pageRoot = htmlparser.parse(pageContents, {
    comment: true,
    script: true,
    style: true,
    noscript: true,
    pre: true,
  });
  let mergedContents = "";
  // only merged custom imports if we are handling a page
  const customImports = outletType === 'content' ? matchingRoute?.imports ?? [] : []

  const appTitle = layoutRoot ? layoutRoot.querySelector("head title") : null;
  const appBody = layoutRoot.querySelector("body") ? layoutRoot.querySelector("body").innerHTML : layoutContents ?? "";
  const pageBody =
    pageRoot && pageRoot.querySelector("body") ? pageRoot.querySelector("body").innerHTML : pageContents ?? "";
  const pageTitle = pageRoot && pageRoot.querySelector("head title");
  // const hasActiveFrontmatterTitle =
  //   compilation.config.activeContent &&
  //   ((pageTitle && pageTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0) ||
  //     (appTitle && appTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0));
  const resourcePlugins = compilation.config.plugins
    .filter((plugin) => {
      return plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin;
    })
    .map((plugin) => {
      return plugin.provider(compilation);
    });
  let title;

  if (hasActiveFrontmatterTitle) {
    // const text =
    //   pageTitle && pageTitle.rawText.indexOf(activeFrontmatterTitleKey) >= 0
    //     ? pageTitle.rawText
    //     : appTitle.rawText;

    // title = text.replace(activeFrontmatterTitleKey, matchingRoute.title || matchingRoute.label);
  } else {
    title = matchingRoute.title
      ? matchingRoute.title
      : pageTitle && pageTitle.rawText
        ? pageTitle.rawText
        : appTitle && appTitle.rawText
          ? appTitle.rawText
          : '';
  }

  console.log({ matchingRoute, title, pageTitle, appTitle });

  const mergedHtml =
    pageRoot && pageRoot.querySelector("html") && pageRoot.querySelector("html")?.rawAttrs !== ""
      ? `<html ${pageRoot.querySelector("html").rawAttrs}>`
      : layoutRoot && layoutRoot.querySelector("html") && layoutRoot.querySelector("html")?.rawAttrs !== ""
        ? `<html ${layoutRoot.querySelector("html").rawAttrs}>`
        : "<html>";

  const mergedMeta = [
    ...layoutRoot.querySelectorAll("head meta"),
    ...[...((pageRoot && pageRoot.querySelectorAll("head meta")) || [])],
  ].join("\n");

  const mergedLinks = [
    ...layoutRoot.querySelectorAll("head link"),
    ...[...((pageRoot && pageRoot.querySelectorAll("head link")) || [])],
  ].join("\n");

  const mergedStyles = [
    ...layoutRoot.querySelectorAll("head style"),
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
    ...layoutRoot.querySelectorAll("head script"),
    ...[...((pageRoot && pageRoot.querySelectorAll("head script")) || [])],
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

  const outletRegex = outletType === 'content'
    ? /<content-outlet><\/content-outlet>/
    : /<page-outlet><\/page-outlet>/
  const finalBody = appBody.match(outletRegex)
    ? appBody.replace(outletRegex, pageBody)
    : pageBody;

  console.log({ outletType, outletRegex, appBody, pageBody, finalBody })
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

  return mergedContents;
}

// merges provided page content into a page level layout
// TODO document this function and params
// TODO do we absolutely need to pass matchingRoute?
// TODO better name for this?
async function getPageLayoutContents(pageContents, compilation, matchingRoute, ssrLayout) {
  console.log('getPageLayoutContents ???', { pageContents, matchingRoute });
  const { config, context } = compilation;
  const { layoutsDir, userLayoutsDir, pagesDir } = context;
  const { layout, pageHref, route } = matchingRoute;
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
  // const extension = pageHref?.split(".")?.pop();
  const is404Page = route.endsWith('/404/');
  const hasCustomStaticLayout = await checkResourceExists(
    new URL(`./${layout}.html`, userLayoutsDir),
  );
  const hasCustomDynamicLayout = await checkResourceExists(
    new URL(`./${layout}.js`, userLayoutsDir),
  );
  const hasCustomDynamicTypeScriptLayout = await checkResourceExists(
    new URL(`./${layout}.ts`, userLayoutsDir),
  );
  const hasPageLayout = await checkResourceExists(new URL("./page.html", userLayoutsDir));
  const hasCustom404Page = await checkResourceExists(new URL("./404.html", pagesDir));
  // const isHtmlPage = extension === "html" && (await checkResourceExists(new URL(pageHref)));
  let layoutContents;

  console.log({ is404Page, hasCustom404Page, pageHref, layout, hasCustomStaticLayout, hasCustomDynamicLayout, hasCustomDynamicTypeScriptLayout });
  // TODO document all these conditions
  if(ssrLayout) {
    console.log('EXISTING SSR LAYOUT ALREADY PROVIDED')
    layoutContents = ssrLayout;
  } else if (layout && (customPluginPageLayouts.length > 0 || hasCustomStaticLayout)) {
    console.log('hasCustomStaticLayout / customPluginPageLayouts / layout', { pageHref, layout });
    // use a custom layout, usually from markdown frontmatter
    layoutContents =
      customPluginPageLayouts.length > 0
        ? await fs.readFile(new URL(`./${layout}.html`, customPluginPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL(`./${layout}.html`, userLayoutsDir), "utf-8");
  } else if (isCustomStaticPage) {
    console.log('isCustomStaticPage (e.g. context plugin', { pageHref, layout });
    // transform, then use that as the layout, NOT accounting for 404 pages
    const transformed = await customPageFormatPlugins[0].serve(filePathUrl);
    layoutContents = await transformed.text();
  } else if (customPluginDefaultPageLayouts.length > 0 || (!is404Page && hasPageLayout)) {
    console.log('HAS LAYOUT customPluginDefaultPageLayouts', { pageHref, layout });
    // else look for default page layout from the user
    // and 404 pages should be their own "top level" layout
    layoutContents =
      customPluginDefaultPageLayouts.length > 0
        ? await fs.readFile(new URL("./page.html", customPluginDefaultPageLayouts[0]), "utf-8")
        : await fs.readFile(new URL("./page.html", userLayoutsDir), "utf-8");
  // } else if(layoutContents) {
  //   // console.log('HAS LAYOUT CONTENTS', { pageHref, layout });
  //   mergedContents = layoutContents;
  } else if ((hasCustomDynamicLayout || hasCustomDynamicTypeScriptLayout) && !is404Page) {
    console.log('CUSTOM DYNAMIC LAYOUT', { pageHref, layout });
    const routeModuleLocationUrl = hasCustomDynamicLayout
      ? new URL(`./${layout}.js`, userLayoutsDir)
      : new URL(`./${layout}.ts`, userLayoutsDir);
    const routeWorkerUrl = compilation.config.plugins
      .find((plugin) => plugin.type === "renderer")
      .provider().executeModuleUrl;

    await new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./ssr-route-worker.js", import.meta.url));

      worker.on("message", (result) => {
        console.log('???????????', { result });
        if (result.body) {
          layoutContents = result.body;
          console.log('SSR layout', { pageHref, layoutContents });
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
  // } else if (is404Page) {
  //   // TODO treat 404 like any other page when no longer providing default content, not just HTML
  //   // then 404 page content can just come from html plugin processing
  //   console.log({ is404Page, hasCustom404Page })
  //   const pathUrl = hasCustom404Page
  //     ? new URL("./404.html", pagesDir)
  //     : new URL("./404.html", layoutsDir);

  //   layoutContents = await fs.readFile(pathUrl, "utf-8");
  } else if(!pageContents) {
    console.log('DEFAULT GWD page.html fallback');
    // fallback to using Greenwood's stock page layout
    // TODO do we even want this?
    // https://github.com/ProjectEvergreen/greenwood/issues/1271
    layoutContents = await fs.readFile(new URL("./page.html", layoutsDir), "utf-8");
  }

  const mergedContents = await mergeContentIntoLayout('content', pageContents, layoutContents, compilation, matchingRoute);

  console.log('MERGED PAGE LAYOUT + CONTENTS', { layoutContents, mergedContents });

  return mergedContents;
}

// merges provided page + layout contents into an app level layout
// TODO document this function and params
// TODO do we absolutely need to pass matchingRoute?
// TODO better name for this?
async function getAppLayoutContents(pageLayoutContents, compilation, matchingRoute) {
  const activeFrontmatterTitleKey = "${globalThis.page.title}";
  const enableHud = compilation.config.devServer.hud;
  const { layoutsDir, userLayoutsDir } = compilation.context;
  const userStaticAppLayoutUrl = new URL("./app.html", userLayoutsDir);
  const userDynamicAppLayoutUrl = new URL("./app.js", userLayoutsDir);
  const userDynamicAppLayoutTypeScriptUrl = new URL("./app.ts", userLayoutsDir);
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
        moduleUrl: userHasDynamicAppLayout
          ? userDynamicAppLayoutUrl.href
          : userDynamicAppLayoutTypeScriptUrl.href,
        compilation: JSON.stringify(compilation),
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
          : await fs.readFile(new URL("./app.html", layoutsDir), "utf-8");
  let mergedLayoutContents = "";

  // TODO rename these roots...
  const pageRoot =
    pageLayoutContents &&
    htmlparser.parse(pageLayoutContents, {
      comment: matchingRoute.isSSR,
      script: true,
      style: true,
      noscript: true,
      pre: true,
    });
  const appRoot = htmlparser.parse(appLayoutContents, {
    comment: matchingRoute.isSSR,
    script: true,
    style: true,
    noscript: true,
    pre: true,
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
    mergedLayoutContents = await mergeContentIntoLayout('page', pageLayoutContents, appLayoutContents, compilation, matchingRoute);

    console.log('MERGED APP LAYOUT + CONTENTS', { appLayoutContents, mergedLayoutContents });
  }

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

export { getAppLayout, getPageLayout, getGreenwoodScripts, getPageLayoutContents, getAppLayoutContents };
