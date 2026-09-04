/*
 *
 * A plugin for enabling CSS Modules. :tm:
 *
 */
import fs from "node:fs";
import { parse as hparse } from "node-html-parser";
import { generate, parse, walk } from "css-tree";
import * as acornWalk from "acorn-walk";
import * as acorn from "acorn";
import { hashString } from "@greenwood/cli/src/lib/hashing-utils.js";
import { ACORN_OPTIONS } from "@greenwood/cli/src/lib/parsing-utils.js";

async function getTransformedScriptContents(scriptUrl, compilation) {
  const resourcePlugins = compilation.config.plugins
    .filter((plugin) => {
      // exclude the CSS Module related plugins, which would strip imports before scanning happens
      return (
        plugin.type === "resource" &&
        plugin.name !== "plugin-css-modules-strip-modules" &&
        plugin.name !== "plugin-css-modules:scan"
      );
    })
    .map((plugin) => {
      return plugin.provider(compilation);
    });

  const request = new Request(scriptUrl, { headers: { Accept: "text/javascript" } });
  let response = new Response("", { headers: { "Content-Type": "text/javascript" } });

  for (const plugin of resourcePlugins) {
    if (plugin.shouldServe && (await plugin.shouldServe(scriptUrl, request))) {
      response = await plugin.serve(scriptUrl, request);
    }
  }

  for (const plugin of resourcePlugins) {
    if (
      plugin.shouldPreIntercept &&
      (await plugin.shouldPreIntercept(scriptUrl, request, response.clone()))
    ) {
      response = await plugin.preIntercept(scriptUrl, request, response.clone());
    }
  }

  for (const plugin of resourcePlugins) {
    if (
      plugin.shouldIntercept &&
      (await plugin.shouldIntercept(scriptUrl, request, response.clone()))
    ) {
      response = await plugin.intercept(scriptUrl, request, response.clone());
    }
  }

  return await response.text();
}

function transformCssModule(cssModuleUrl) {
  const scope = cssModuleUrl.pathname.split("/").pop().split(".")[0];
  const cssContents = fs.readFileSync(cssModuleUrl, "utf-8");
  const hash = hashString(cssContents);
  const classNameMap = {};

  const ast = parse(cssContents, {
    onParseError(error) {
      console.log(error.formattedMessage);
    },
  });

  walk(ast, {
    enter: function (node) {
      if (node.type === "ClassSelector") {
        const originalName = node.name;
        const scopedName = `${scope}-${hash}-${originalName}`;

        classNameMap[originalName] = scopedName;
        node.name = scopedName;
      }
    },
  });

  return {
    module: classNameMap,
    contents: generate(ast),
  };
}

async function walkAllImportsForCssModules(
  scriptUrl,
  compilation,
  cssModules = new Map(),
  visitedScripts = new Set(),
) {
  if (visitedScripts.has(scriptUrl.href)) {
    return cssModules;
  }

  visitedScripts.add(scriptUrl.href);

  const scriptContents = await getTransformedScriptContents(scriptUrl, compilation);
  const additionalScripts = [];

  acornWalk.simple(acorn.parse(scriptContents, ACORN_OPTIONS), {
    ImportDeclaration(node) {
      const { specifiers = [], source = {} } = node;
      const { value = "" } = source;

      if (value.endsWith(".module.css") && specifiers.length === 1) {
        const cssModuleUrl = new URL(value, scriptUrl);
        cssModules.set(cssModuleUrl.href, transformCssModule(cssModuleUrl));
      } else {
        const recursiveScriptUrl = new URL(value, scriptUrl);

        if (value && fs.existsSync(recursiveScriptUrl)) {
          additionalScripts.push(recursiveScriptUrl);
        }
      }
    },
  });

  for (const script of additionalScripts) {
    await walkAllImportsForCssModules(script, compilation, cssModules, visitedScripts);
  }

  return cssModules;
}

// this happens 'first' as the HTML is returned, to find viable references to CSS Modules
// and inline those into a <style> tag on the page
class ScanForCssModulesResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["module.css"];
    this.contentType = "text/javascript";
  }

  async shouldIntercept(url) {
    const { pathname, protocol } = url;

    return (
      url.pathname.endsWith("/") || (protocol === "file:" && pathname.endsWith(this.extensions[0]))
    );
  }

  async intercept(url, request, response) {
    const { pathname, protocol } = url;

    if (url.pathname.endsWith("/")) {
      const body = await response.text();
      const dom = hparse(body);
      const scripts = dom.querySelectorAll("head script");
      const cssModules = new Map();

      for (const script of scripts) {
        const type = script.getAttribute("type") ?? "";
        const src = script.getAttribute("src");

        // allow module and module-shims attributes
        if (src && type.startsWith("module")) {
          const scriptUrl = new URL(
            `./${src.replace(/\.\.\//g, "").replace(/\.\//g, "")}`,
            this.compilation.context.userWorkspace,
          );

          await walkAllImportsForCssModules(scriptUrl, this.compilation, cssModules);
        }
      }

      const sheets = [...cssModules.values()].map((cssModule) => cssModule.contents);

      const newBody = body.replace(
        "</head>",
        `
          <style>
            ${sheets.join("\n")}
          </style>
        </head>
      `,
      );

      return new Response(newBody);
    } else if (protocol === "file:" && pathname.endsWith(this.extensions[0])) {
      // handle this primarily for SSR / prerendering use case
      const { module } = transformCssModule(url);
      const cssModule = `export default ${JSON.stringify(module)}`;

      return new Response(cssModule, {
        headers: {
          "Content-Type": this.contentType,
        },
      });
    }
  }
}

// this process all files that have CssModules content used
// and strip out the `import` and replace all the references in class attributes with static values
class StripCssModulesResource {
  async shouldIntercept(url, request, response) {
    const contentType = response.headers.get("Content-Type") ?? "";
    const accept = request.headers.get("Accept") ?? "";

    return (
      url.protocol === "file:" &&
      (contentType.includes("javascript") || accept.includes("javascript")) &&
      (await response.text()).includes(".module.css")
    );
  }

  async intercept(url, request, response) {
    let contents = await response.text();
    const cssModuleImports = [];
    const ast = acorn.parse(contents, ACORN_OPTIONS);

    acornWalk.simple(ast, {
      ImportDeclaration(node) {
        const { specifiers = [], source = {}, start, end } = node;
        const { value = "" } = source;

        if (value.endsWith(".module.css") && specifiers.length === 1) {
          cssModuleImports.push({
            start,
            end,
            identifier: specifiers[0].local.name,
            cssModuleUrl: new URL(value, url),
          });
        }
      },
    });

    // Build a class map for each CSS Module import, collect edit locations for replacements,
    // and then apply the edits in reverse order to preserve AST offsets
    const cssModulesByIdentifier = new Map();
    const sourceEdits = cssModuleImports.map(({ start, end, identifier, cssModuleUrl }) => {
      const { module } = transformCssModule(cssModuleUrl);

      cssModulesByIdentifier.set(identifier, module);

      return { start, end, replacement: " \n " };
    });

    acornWalk.ancestor(ast, {
      MemberExpression(node, ancestors) {
        if (node.object.type !== "Identifier") {
          return;
        }

        const module = cssModulesByIdentifier.get(node.object.name);
        const key = node.computed
          ? node.property.type === "Literal" && typeof node.property.value === "string"
            ? node.property.value
            : null
          : node.property.type === "Identifier"
            ? node.property.name
            : null;
        const scopedName = key ? module?.[key] : null;

        if (!scopedName) {
          return;
        }

        const parent = ancestors.at(-2);
        const interpolationStart = node.start - 2;
        const interpolationEnd = node.end + 1;
        const isDirectTemplateInterpolation =
          parent?.type === "TemplateLiteral" &&
          contents.slice(interpolationStart, node.start) === "${" &&
          contents.slice(node.end, interpolationEnd) === "}";

        sourceEdits.push({
          start: isDirectTemplateInterpolation ? interpolationStart : node.start,
          end: isDirectTemplateInterpolation ? interpolationEnd : node.end,
          replacement: isDirectTemplateInterpolation ? scopedName : JSON.stringify(scopedName),
        });
      },
    });

    for (const { start, end, replacement } of sourceEdits.sort((a, b) => b.start - a.start)) {
      contents = `${contents.slice(0, start)}${replacement}${contents.slice(end)}`;
    }

    return new Response(contents);
  }
}

/** @type {import('./types/index.d.ts').CssModulesPlugin} */
const greenwoodPluginCssModules = () => {
  return [
    {
      type: "resource",
      name: "plugin-css-modules:scan",
      provider: (compilation) => new ScanForCssModulesResource(compilation),
    },
    {
      type: "resource",
      name: "plugin-css-modules-strip-modules",
      provider: () => new StripCssModulesResource(),
    },
  ];
};

export { greenwoodPluginCssModules };
