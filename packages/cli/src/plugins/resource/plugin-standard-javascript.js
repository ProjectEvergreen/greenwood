/*
 *
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import terser from "@rollup/plugin-terser";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { ACORN_OPTIONS } from "../../lib/parsing-utils.js";

class StandardJavaScriptResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["js"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.includes(url.pathname.split(".").pop());
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");

    return new Response(body, {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }

  async shouldPreIntercept(url, request, response) {
    const { polyfills } = this.compilation.config;

    return (
      (polyfills?.importAttributes || []).length > 0 &&
      url.protocol === "file:" &&
      response.headers.get("Content-Type").indexOf(this.contentType) >= 0
    );
  }

  async preIntercept(url, request, response) {
    const { polyfills } = this.compilation.config;
    const body = await response.clone().text();
    let polyfilled = body;

    // rewrite `import ... with { type: "css" | "json" }` (static and dynamic) into
    // Greenwood's `?polyfill=type-<attr>` query form, using each node's own AST character
    // offsets so only the matched specifier and its attributes clause are edited, never
    // comments, string literals, or same-named bindings, and each import is handled
    // independently; unparseable sources (e.g. legacy `assert`) pass through untouched
    // https://github.com/ProjectEvergreen/greenwood/issues/1721
    const edits = [];
    const keyName = (key) => key.name ?? key.value;
    const polyfillAttribute = (type) =>
      typeof type === "string" && polyfills.importAttributes.includes(type) ? type : null;
    const rewriteSpecifier = (source, attribute) => {
      const raw = body.slice(source.start, source.end);
      const quote = raw.slice(-1);

      edits.push({
        start: source.start,
        end: source.end,
        replacement: `${raw.slice(0, -1)}?polyfill=type-${attribute}${quote}`,
      });
    };

    try {
      walk.simple(acorn.parse(body, ACORN_OPTIONS), {
        ImportDeclaration(node) {
          const attributes = node.attributes ?? [];
          const typeAttribute = attributes.find((attribute) => keyName(attribute.key) === "type");
          const attribute = typeAttribute && polyfillAttribute(typeAttribute.value.value);

          if (!attribute) {
            return;
          }

          rewriteSpecifier(node.source, attribute);
          // drop the trailing `with { ... }` / `assert { ... }` clause by its AST range
          const closeBrace = body.indexOf("}", attributes[attributes.length - 1].end);
          edits.push({ start: node.source.end, end: closeBrace + 1, replacement: "" });
        },
        ImportExpression(node) {
          if (node.options?.type !== "ObjectExpression") {
            return;
          }

          const clause = node.options.properties.find((property) =>
            ["with", "assert"].includes(keyName(property.key)),
          );

          if (clause?.value.type !== "ObjectExpression") {
            return;
          }

          const typeProperty = clause.value.properties.find(
            (property) => keyName(property.key) === "type",
          );
          const attribute = typeProperty && polyfillAttribute(typeProperty.value.value);

          if (!attribute) {
            return;
          }

          rewriteSpecifier(node.source, attribute);
          // drop the trailing `, { with: { type } }` options argument by its AST range
          edits.push({ start: node.source.end, end: node.options.end, replacement: "" });
        },
      });

      // apply edits by descending offset so earlier splices do not shift later ones
      polyfilled = edits
        .sort((a, b) => b.start - a.start)
        .reduce(
          (source, { start, end, replacement }) =>
            source.slice(0, start) + replacement + source.slice(end),
          body,
        );
    } catch (e) {
      // never brick the build on syntax the polyfill cannot parse; serve it unchanged
      console.warn(`Unable to parse ${url.pathname} for import attributes, skipping polyfill.`, e);
      polyfilled = body;
    }

    return new Response(polyfilled, {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }
}

const greenwoodPluginStandardJavascript = [
  {
    type: "resource",
    name: "plugin-standard-javascript:resource",
    provider: (compilation) => new StandardJavaScriptResource(compilation),
  },
  {
    type: "rollup",
    name: "plugin-standard-javascript:rollup",
    provider: (compilation) => {
      return compilation.config.optimization !== "none" ? [terser()] : [];
    },
  },
];

export { greenwoodPluginStandardJavascript };
