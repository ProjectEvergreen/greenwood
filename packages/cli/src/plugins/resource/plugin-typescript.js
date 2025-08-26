/*
 *
 * Manages resource related operations for TypeScript.
 *
 * This is a Greenwood default plugin.
 *
 */
import amaro from "amaro";
import fs from "node:fs/promises";
import { checkResourceExists } from "../../lib/resource-utils.js";

const defaultCompilerOptions = {
  target: "ES2020",
  module: "preserve",
  moduleResolution: "bundler",
  allowImportingTsExtensions: true,
  erasableSyntaxOnly: true,
  noEmit: true,
  verbatimModuleSyntax: false,
};

async function getCompilerOptions(projectDirectory) {
  const userConfigUrl = new URL("./tsconfig.json", projectDirectory);
  let options = defaultCompilerOptions;

  if (await checkResourceExists(userConfigUrl)) {
    // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
    const userConfig = (await import(userConfigUrl, { with: { type: "json" } })).default;

    options = userConfig.compilerOptions;
  }

  return options;
}

class StandardTypeScriptResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["ts"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.includes(url.pathname.split(".").pop());
  }

  async serve(url) {
    const { useTsc } = this.compilation.config;
    const body = await fs.readFile(url, "utf-8");
    let code = "";

    if (useTsc) {
      const compilerOptions = await getCompilerOptions(this.compilation.context.projectDirectory);
      const tsc = (await import("typescript").then((mod) => mod)).default;

      code = tsc.transpileModule(body, { compilerOptions }).outputText;
    } else {
      code = amaro.transformSync(body, { mode: "strip-only" }).code;
    }

    return new Response(code, {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }
}

const greenwoodPluginTypeScript = [
  {
    type: "resource",
    name: "plugin-typescript",
    provider: (compilation) => new StandardTypeScriptResource(compilation),
  },
];

export { greenwoodPluginTypeScript };
