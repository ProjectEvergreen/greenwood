/*
 *
 * A plugin for enabling CSS Modules. :tm:
 *
 */
import fs from "fs";
import * as htmlparser from "node-html-parser";
import { parse, walk } from "css-tree";
import { ResourceInterface } from "@greenwood/cli/src/lib/resource-interface.js";
import * as acornWalk from "acorn-walk";
import * as acorn from "acorn";
import { hashString } from "@greenwood/cli/src/lib/hashing-utils.js";
import { transform } from "sucrase";
import { ACORN_OPTIONS } from "@greenwood/cli/src/lib/parsing-utils.js";

const MODULES_MAP_FILENAME = "__css-modules-map.json";
/*
 * we have to write the modules map to a file to preserve the state between static and SSR / prerendering
 * since if we try and do something like `globalThis.cssModulesMap = globalThis.cssModulesMap ?? {}`
 * it won't persist across Worker threads.  Maybe if we find a solution to this, we would handle this all in memory.
 *
 * https://github.com/ProjectEvergreen/greenwood/discussions/1117
 */
function getCssModulesMap(compilation) {
  const locationUrl = new URL(`./${MODULES_MAP_FILENAME}`, compilation.context.scratchDir);
  let cssModulesMap = {};

  if (fs.existsSync(locationUrl)) {
    cssModulesMap = JSON.parse(fs.readFileSync(locationUrl));
  }

  return cssModulesMap;
}

function walkAllImportsForCssModules(scriptUrl, sheets, compilation) {
  const scriptContents = fs.readFileSync(scriptUrl, "utf-8");
  const result = transform(scriptContents, {
    transforms: ["typescript", "jsx"],
    jsxRuntime: "preserve",
  });

  acornWalk.simple(acorn.parse(result.code, ACORN_OPTIONS), {
    ImportDeclaration(node) {
      const { specifiers = [], source = {} } = node;
      const { value = "" } = source;

      if (value.endsWith(".module.css") && specifiers.length === 1) {
        const identifier = specifiers[0].local.name;
        const cssModuleUrl = new URL(value, scriptUrl);
        const scope = cssModuleUrl.pathname.split("/").pop().split(".")[0];
        const cssContents = fs.readFileSync(cssModuleUrl, "utf-8");
        const hash = hashString(cssContents);
        const classNameMap = {};
        let scopedCssContents = cssContents;

        const ast = parse(cssContents, {
          onParseError(error) {
            console.log(error.formattedMessage);
          },
        });

        walk(ast, {
          enter: function (node) {
            // drill down from a SelectorList to its first Selector
            // and check its first child to see if it is a ClassSelector
            // and if so, hash that initial class selector

            if (node.type === "SelectorList") {
              if (node.children?.head?.data?.type === "Selector") {
                if (node.children?.head?.data?.children?.head?.data?.type === "ClassSelector") {
                  const { name } = node.children.head.data.children.head.data;
                  const scopedClassName = `${scope}-${hash}-${name}`;
                  classNameMap[name] = scopedClassName;

                  /*
                   * bit of a hacky solution since as we are walking class names one at a time, if we have multiple uses of .heading (for example)
                   * then by the end we could have .my-component-111-header.my-component-111-header.etc, since we want to replace all instances (e.g. the g flag in Regex)
                   *
                   * csstree supports loc so we _could_ target the class replacement down to start / end points, but that unfortunately slows things down a lot
                   */
                  if (
                    scopedCssContents.indexOf(`.${scopedClassName} `) < 0 &&
                    scopedCssContents.indexOf(`.${scopedClassName} {`) < 0
                  ) {
                    scopedCssContents = scopedCssContents.replace(
                      new RegExp(String.raw`.${name} `, "g"),
                      `.${scope}-${hash}-${name} `,
                    );
                    scopedCssContents = scopedCssContents.replace(
                      new RegExp(String.raw`.${name},`, "g"),
                      `.${scope}-${hash}-${name},`,
                    );
                    scopedCssContents = scopedCssContents.replace(
                      new RegExp(String.raw`.${name}:`, "g"),
                      `.${scope}-${hash}-${name}:`,
                    );
                  }
                }
              }
            }
          },
        });

        const cssModulesMap = getCssModulesMap(compilation);

        fs.writeFileSync(
          new URL(`./${MODULES_MAP_FILENAME}`, compilation.context.scratchDir),
          JSON.stringify({
            ...cssModulesMap,
            [`${cssModuleUrl.href}`]: {
              module: classNameMap,
              contents: scopedCssContents,
              importer: scriptUrl,
              identifier,
            },
          }),
        );
      } else if (value.endsWith(".js") || value.endsWith(".jsx") || value.endsWith(".ts")) {
        // no good way to get at async plugin processing so right now
        // we can only support what we can provide to acorn
        const recursiveScriptUrl = new URL(value, scriptUrl);

        if (fs.existsSync(recursiveScriptUrl)) {
          walkAllImportsForCssModules(recursiveScriptUrl, sheets, compilation);
        }
      }
    },
  });
}

// this happens 'first' as the HTML is returned, to find viable references to CSS Modules
// and inline those into a <style> tag on the page
class ScanForCssModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ["module.css"];
    this.contentType = "text/javascript";

    if (!fs.existsSync(this.compilation.context.scratchDir)) {
      fs.mkdirSync(this.compilation.context.scratchDir, { recursive: true });
      fs.writeFileSync(
        new URL(`./${MODULES_MAP_FILENAME}`, this.compilation.context.scratchDir),
        JSON.stringify({}),
      );
    }
  }

  async shouldIntercept(url) {
    const { pathname, protocol } = url;
    const mapKey = `${protocol}//${pathname}`;
    const cssModulesMap = getCssModulesMap(this.compilation);

    return (
      url.pathname.endsWith("/") ||
      (protocol === "file:" && pathname.endsWith(this.extensions[0]) && cssModulesMap[mapKey])
    );
  }

  async intercept(url, request, response) {
    const { pathname, protocol } = url;
    const mapKey = `${protocol}//${pathname}`;
    const cssModulesMap = getCssModulesMap(this.compilation);

    if (url.pathname.endsWith("/")) {
      const body = await response.text();
      const dom = htmlparser.parse(body, { script: true });
      const scripts = dom.querySelectorAll("head script");
      const sheets = [];

      for (const script of scripts) {
        const type = script.getAttribute("type") ?? "";
        const src = script.getAttribute("src");

        // allow module and module-shims attributes
        if (src && type.startsWith("module")) {
          const scriptUrl = new URL(
            `./${src.replace(/\.\.\//g, "").replace(/\.\//g, "")}`,
            this.compilation.context.userWorkspace,
          );
          walkAllImportsForCssModules(scriptUrl, sheets, this.compilation);
        }
      }

      const cssModulesMap = getCssModulesMap(this.compilation);

      Object.keys(cssModulesMap).forEach((key) => {
        sheets.push(cssModulesMap[key].contents);
      });

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
    } else if (
      protocol === "file:" &&
      pathname.endsWith(this.extensions[0]) &&
      cssModulesMap[mapKey]
    ) {
      // handle this primarily for SSR / prerendering use case
      const cssModule = `export default ${JSON.stringify(cssModulesMap[mapKey].module)}`;

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
class StripCssModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ["module.css"];
    this.contentType = "text/javascript";
  }

  async shouldIntercept(url) {
    const cssModulesMap = getCssModulesMap(this.compilation);

    for (const [, value] of Object.entries(cssModulesMap)) {
      if (url.href === value.importer) {
        return true;
      }
    }
  }

  async intercept(url, request, response) {
    const { context } = this.compilation;
    let contents = await response.text();

    acornWalk.simple(acorn.parse(contents, ACORN_OPTIONS), {
      ImportDeclaration(node) {
        const { specifiers = [], source = {}, start, end } = node;
        const { value = "" } = source;

        if (value.endsWith(".module.css") && specifiers.length === 1) {
          contents = `${contents.slice(0, start)} \n ${contents.slice(end)}`;
          const cssModulesMap = getCssModulesMap({ context });

          Object.values(cssModulesMap).forEach((value) => {
            const { importer, module, identifier } = value;

            if (importer === url.href) {
              Object.keys(module).forEach((key) => {
                const literalUsageRegex = new RegExp(String.raw`\$\{${identifier}.${key}\}`, "g");
                // https://stackoverflow.com/a/20851557/417806
                const expressionUsageRegex = new RegExp(
                  String.raw`(((?<![-\w\d\W])|(?<=[> \n\r\b]))${identifier}\.${key}((?![-\w\d\W])|(?=[ <.,:;!?\n\r\b])))`,
                  "g",
                );

                if (literalUsageRegex.test(contents)) {
                  contents = contents.replace(literalUsageRegex, module[key]);
                } else if (expressionUsageRegex.test(contents)) {
                  contents = contents.replace(expressionUsageRegex, `'${module[key]}'`);
                }
              });
            }
          });
        }
      },
    });

    return new Response(contents);
  }
}

const greenwoodPluginCssModules = () => {
  return [
    {
      type: "resource",
      name: "plugin-css-modules:scan",
      provider: (compilation, options) => new ScanForCssModulesResource(compilation, options),
    },
    {
      type: "resource",
      name: "plugin-css-modules-strip-modules",
      provider: (compilation, options) => new StripCssModulesResource(compilation, options),
    },
  ];
};

export { greenwoodPluginCssModules };
