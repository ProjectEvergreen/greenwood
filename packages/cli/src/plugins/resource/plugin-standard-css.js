/*
 *
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs";
import { copyFileWithRetry } from "../../lib/fs-utils.js";
import path from "node:path";
import { parse, walk } from "css-tree";
import { hashString } from "../../lib/hashing-utils.js";
import { getResolvedHrefFromPathnameShortcut } from "../../lib/node-modules-utils.js";
import { isLocalLink } from "../../lib/resource-utils.js";
import { derivePackageRoot } from "../../lib/walker-package-ranger.js";

function bundleCss(body, sourceUrl, compilation, workingUrl) {
  const { projectDirectory, outputDir, userWorkspace, scratchDir } = compilation.context;
  const ast = parse(body, {
    onParseError(error) {
      console.log(error.formattedMessage);
    },
  });
  let optimizedCss = "";

  walk(ast, {
    enter: function (node, item) {
      const { type, name, value, children } = node;

      if (
        (type === "String" || type === "Url") &&
        this.atrulePrelude &&
        this.atrule.name === "import"
      ) {
        const { value } = node;
        const segments = value.split("/") ?? "";
        const isBareSpecifier =
          segments[0].startsWith("@") ||
          (!segments[0].startsWith(".") && !segments[0].startsWith("/"));

        if (isLocalLink(value)) {
          if (value.startsWith(".") || value.indexOf("/node_modules") === 0) {
            const resolvedUrl = value.startsWith("/node_modules")
              ? new URL(getResolvedHrefFromPathnameShortcut(value, projectDirectory))
              : new URL(value, sourceUrl);

            const importContents = fs.readFileSync(resolvedUrl, "utf-8");

            optimizedCss += bundleCss(importContents, sourceUrl, compilation, resolvedUrl);
          } else if (workingUrl) {
            const urlPrefix = value.startsWith(".") ? "" : "./";
            const resolvedUrl = new URL(`${urlPrefix}${value}`, workingUrl);
            const importContents = fs.readFileSync(resolvedUrl, "utf-8");

            optimizedCss += bundleCss(importContents, workingUrl, compilation);
          } else if (isBareSpecifier) {
            // gracefully / silently account for `import.meta.resolve` caveat when using loader hooks
            // https://nodejs.org/api/esm.html#importmetaresolvespecifier
            // https://github.com/ProjectEvergreen/greenwood/pull/1511#discussion_r2122365577
            if (import.meta?.resolve) {
              const resolvedUrl = import.meta.resolve(value);
              const importContents = fs.readFileSync(new URL(resolvedUrl), "utf-8");

              optimizedCss += bundleCss(importContents, sourceUrl, compilation, resolvedUrl);
            }
          } else {
            console.warn(`Unable to resolve ${value} from file => ${sourceUrl}`);
          }
        } else {
          optimizedCss += `@import url('${value}');`;
        }
      } else if (type === "Url" && this.atrule?.name !== "import") {
        if (!isLocalLink(value) || value.startsWith("data:")) {
          optimizedCss += `url('${value}')`;
          return;
        }

        const { basePath } = compilation.config;

        /*
         * Our resolution algorithm works as follows:
         * 1. First, check if it is a shortcut alias to node_modules, in which we use Node's resolution algorithm
         * 2. Next, check if it is an absolute path "escape" hatch based path and just resolve to the user's workspace
         * 3. If there is a workingUrl, then just join the current value with the current working file we're processing
         * 4. If the starting file is in the scratch directory, likely means it is just an extracted inline <style> tag, so resolve to user workspace
         * 5. Lastly, match the current value with the current source file
         */
        const urlPrefix = value.startsWith(".") ? "" : "./";
        const resolvedUrl = value.startsWith("/node_modules/")
          ? new URL(getResolvedHrefFromPathnameShortcut(value, projectDirectory))
          : value.startsWith("/")
            ? new URL(`.${value}`, userWorkspace)
            : workingUrl
              ? new URL(`${urlPrefix}${value}`, workingUrl)
              : sourceUrl.href.startsWith(scratchDir.href)
                ? new URL(`./${value.replace(/\.\.\//g, "").replace("./", "")}`, userWorkspace)
                : new URL(`${urlPrefix}${value}`, sourceUrl);

        if (fs.existsSync(resolvedUrl)) {
          const isDev = process.env.__GWD_COMMAND__ === "develop";
          let finalValue = "";

          if (resolvedUrl.href.startsWith(userWorkspace.href)) {
            // truncate to just get /path/in/users/workspace.png
            finalValue = resolvedUrl.href.replace(userWorkspace.href, "/");
          } else if (value.startsWith("/node_modules/")) {
            // if it's a node modules shortcut alias, just use that
            finalValue = value;
          } else if (value.indexOf("../node_modules/") >= 0) {
            // if it's a relative node_modules path, convert it to a shortcut alias
            finalValue = `/${value.replace(/\.\.\//g, "")}`;
          } else if (resolvedUrl.href.indexOf("/node_modules/") >= 0) {
            // if we are deep in node_modules land, use resolution logic to figure out the specifier
            const resolvedRoot = derivePackageRoot(resolvedUrl.href);
            const resolvedRootSegments = resolvedRoot
              .split("/")
              .reverse()
              .filter((segment) => segment !== "");
            const specifier = resolvedRootSegments[1].startsWith("@")
              ? `${resolvedRootSegments[0]}/${resolvedRootSegments[1]}`
              : resolvedRootSegments[0];

            finalValue = `/node_modules/${specifier}/${value.replace(/\.\.\//g, "").replace("./", "")}`;
          }

          if (!isDev) {
            const hash = hashString(fs.readFileSync(resolvedUrl, "utf-8"));
            const ext = resolvedUrl.pathname.split(".").pop();

            finalValue = finalValue.replace(`.${ext}`, `.${hash}.${ext}`);
            // "obfuscate" these file names since some hosting platforms may ignore node_modules within the build folder
            // https://github.com/ProjectEvergreen/greenwood/issues/1431
            finalValue = finalValue.replace("/node_modules/", "/node-modules/");

            fs.mkdirSync(new URL(`.${path.dirname(finalValue)}/`, outputDir), {
              recursive: true,
            });

            // Use copy helper with retry to avoid intermittent EBUSY on Windows CI
            // bundleCss is synchronous, so we don't await here; log any copy errors.
            copyFileWithRetry(resolvedUrl, new URL(`.${finalValue}`, outputDir)).catch((err) =>
              console.error('ERROR copying asset during CSS bundling', resolvedUrl.href, err),
            );
          }

          optimizedCss += `url('${basePath}${finalValue}')`;
        } else {
          console.warn(
            `Unable to locate ${value}.  You may need to manually copy this file from its source location to the build output directory.`,
          );
          optimizedCss += `url('${value}')`;
        }
      } else if (type === "Atrule" && name !== "import") {
        optimizedCss += `@${name} `;
      } else if (type === "TypeSelector") {
        optimizedCss += name;
      } else if (type === "IdSelector") {
        optimizedCss += `#${name}`;
      } else if (type === "ClassSelector") {
        optimizedCss += `.${name}`;
      } else if (type === "NestingSelector") {
        optimizedCss += "&";
      } else if (type === "PseudoClassSelector") {
        optimizedCss += `:${name}`;

        if (children) {
          switch (name) {
            case "dir":
            case "host":
            case "is":
            case "has":
            case "lang":
            case "not":
            case "nth-child":
            case "nth-last-child":
            case "nth-of-type":
            case "nth-last-of-type":
            case "where":
              optimizedCss += "(";
              break;
            default:
              break;
          }
        }
      } else if (type === "PseudoElementSelector") {
        optimizedCss += `::${name}`;

        switch (name) {
          case "highlight":
          case "part":
          case "slotted":
            optimizedCss += "(";
            break;
          default:
            break;
        }
      } else if (type === "Function") {
        /* ex: border-left: 3px solid var(--color-secondary); */
        if (
          this.declaration &&
          item.prev &&
          item.prev.data.type !== "Operator" &&
          item.prev.data.type !== "Url"
        ) {
          optimizedCss += " ";
        }
        optimizedCss += `${name}(`;
      } else if (type === "Feature") {
        optimizedCss += ` (${name}:`;
      } else if (type === "Parentheses" || type === "SupportsDeclaration") {
        optimizedCss += "(";
      } else if (type === "MediaQuery") {
        // https://github.com/csstree/csstree/issues/285#issuecomment-2350230333
        const { mediaType, modifier } = node;
        const type = mediaType !== null ? mediaType : "";
        const operator =
          mediaType && node.condition ? " and" : modifier !== null ? ` ${modifier}` : "";

        optimizedCss += `${type}${operator}`;
      } else if (type === "Block") {
        optimizedCss += "{";
      } else if (type === "AttributeSelector") {
        optimizedCss += "[";
      } else if (type === "Combinator") {
        optimizedCss += name;
      } else if (type === "Nth") {
        const { nth } = node;

        switch (nth.type) {
          case "AnPlusB":
            if (nth.a) {
              optimizedCss += nth.a === "-1" ? "-n" : `${nth.a}n`;
            }
            if (nth.b) {
              optimizedCss += nth.a ? `+${nth.b}` : nth.b;
            }
            break;
          default:
            break;
        }
      } else if (type === "Declaration") {
        optimizedCss += `${node.property}:`;
      } else if (
        type === "Identifier" ||
        type === "Hash" ||
        type === "Dimension" ||
        type === "Number" ||
        (type === "String" && this.atrule?.type !== "import") ||
        type === "Operator" ||
        type === "Raw" ||
        type === "Percentage"
      ) {
        if (item && item.prev && type !== "Operator" && item.prev.data.type !== "Operator") {
          optimizedCss += " ";
        }

        switch (type) {
          case "Dimension":
            optimizedCss += `${value}${node.unit}`;
            break;
          case "Percentage":
            optimizedCss += `${value}%`;
            break;
          case "Hash":
            optimizedCss += `#${value}`;
            break;
          case "Identifier":
            optimizedCss += name;
            break;
          case "Number":
            optimizedCss += value;
            break;
          case "Operator":
            optimizedCss += value;
            break;
          case "String":
            optimizedCss += `'${value}'`;
            break;
          case "Raw":
            optimizedCss += `${value.trim()}`;
            break;
          default:
            break;
        }
      }
    },
    leave: function (node, item) {
      switch (node.type) {
        case "Atrule":
          if (!node.block && node.name !== "import") {
            optimizedCss += ";";
          }
          break;
        case "Block":
          optimizedCss += "}";
          break;
        case "Function":
        case "Parentheses":
        case "SupportsDeclaration":
          optimizedCss += ")";
          break;
        case "PseudoClassSelector":
          if (node.children) {
            switch (node.name) {
              case "dir":
              case "host":
              case "is":
              case "has":
              case "lang":
              case "not":
              case "nth-child":
              case "nth-last-child":
              case "nth-last-of-type":
              case "nth-of-type":
              case "where":
                optimizedCss += ")";
                break;
              default:
                break;
            }
          }
          break;
        case "PseudoElementSelector":
          switch (node.name) {
            case "highlight":
            case "part":
            case "slotted":
              optimizedCss += ")";
              break;
            default:
              break;
          }
          break;
        case "Declaration":
          if (node.important) {
            optimizedCss += "!important";
          }

          if (item?.next || (item?.prev && !item?.next)) {
            optimizedCss += ";";
          }

          break;
        case "Selector":
          if (item.next) {
            optimizedCss += ",";
          }
          break;
        case "AttributeSelector":
          if (node.matcher) {
            // TODO better way to do this?
            // https://github.com/csstree/csstree/issues/207
            const name = node.name.name;
            const value =
              node.value.type === "Identifier" ? node.value.name : `'${node.value.value}'`;

            optimizedCss = optimizedCss.replace(
              `${name}${value}`,
              `${name}${node.matcher}${value}`,
            );
          }
          optimizedCss += "]";
          break;
        case "MediaQuery":
          optimizedCss += ")";
          break;
        default:
          break;
      }
    },
  });

  return optimizedCss;
}

class StandardCssResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["css"];
    this.contentType = "text/css";
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.indexOf(url.pathname.split(".").pop()) >= 0;
  }

  async serve(url) {
    const body = await fs.promises.readFile(url, "utf-8");

    return new Response(body, {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }

  async shouldIntercept(url, request, response) {
    return (
      (url.protocol === "file:" &&
        (response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0 ||
          request.headers.get("Accept")?.indexOf(this.contentType) >= 0)) ||
      request.headers.get("Accept")?.indexOf("text/javascript") > 0 ||
      url.searchParams?.get("polyfill") === "type-css"
    );
  }

  async intercept(url, request, response) {
    let body =
      this.compilation.config.optimization !== "none"
        ? bundleCss(await response.text(), url, this.compilation)
        : await response.text();
    let headers = new Headers();

    if (
      (request.headers.get("Accept")?.indexOf("text/javascript") >= 0 ||
        url.searchParams?.get("polyfill") === "type-css") &&
      !url.searchParams.has("type")
    ) {
      const contents = body.replace(/\r?\n|\r/g, " ").replace(/\\/g, "\\\\");

      body = `const sheet = new CSSStyleSheet();sheet.replaceSync(\`${contents}\`);export default sheet;`;
      headers.set("Content-Type", "text/javascript");
    }

    return new Response(body, { headers });
  }
}

const greenwoodPluginStandardCss = {
  type: "resource",
  name: "plugin-standard-css",
  provider: (compilation) => new StandardCssResource(compilation),
};

export { greenwoodPluginStandardCss };
