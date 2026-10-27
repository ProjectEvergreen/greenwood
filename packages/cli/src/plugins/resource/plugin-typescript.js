/*
 *
 * Manages resource related operations for TypeScript.
 *
 * This is a Greenwood default plugin.
 *
 */
import amaro from "amaro";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { checkResourceExists } from "../../lib/resource-utils.js";

const defaultCompilerOptions = {
  target: "ES2020",
  module: "preserve",
  moduleResolution: "bundler",
  allowImportingTsExtensions: true,
  erasableSyntaxOnly: true,
  noEmit: true,
  verbatimModuleSyntax: true,
};

async function getCompilerOptions(projectDirectory, tsc) {
  const userConfigUrl = new URL("./tsconfig.json", projectDirectory);
  let options = defaultCompilerOptions;

  if (await checkResourceExists(userConfigUrl)) {
    const { config, error } = await tsc.readConfigFile({ uri: userConfigUrl.href });

    if (error) {
      console.error("ERROR parsing tsconfig.json", error);
    } else {
      options = config.compilerOptions;
    }
  }

  // Convert tsconfig strings to API enum values without discovering or compiling project files.
  const { options: compilerOptions } = await tsc.parseJsonConfigFileContent(
    { compilerOptions: options, files: [] },
    { configDirectory: fileURLToPath(projectDirectory) },
  );

  return compilerOptions;
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
      const { API } = await import("typescript/async");
      const tsc = new API();

      try {
        const compilerOptions = await getCompilerOptions(
          this.compilation.context.projectDirectory,
          tsc,
        );

        code = (await tsc.transpileModule(body, { compilerOptions })).outputText;
      } finally {
        await tsc.close();
      }
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
