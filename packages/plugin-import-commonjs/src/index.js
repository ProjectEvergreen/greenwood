/*
 *
 * Detects and fully resolves import requests for CommonJS files in node_modules.
 *
 */
<<<<<<< HEAD
import commonjs from "@rollup/plugin-commonjs";
import fs from "fs/promises";
import { parse, init } from "cjs-module-lexer";
import { ResourceInterface } from "@greenwood/cli/src/lib/resource-interface.js";
import rollupStream from "@rollup/stream";
=======
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs/promises';
import { parse, init } from 'cjs-module-lexer';
import rollupStream from '@rollup/stream';
>>>>>>> d74799f4 (WIP)

// bit of a workaround for now, but maybe this could be supported by cjs-module-lexar natively?
// https://github.com/guybedford/cjs-module-lexer/issues/35
const testForCjsModule = async (url) => {
  const { pathname } = url;
  let isCommonJs = false;

  if (
    pathname.split(".").pop() === ".js" &&
    pathname.startsWith("/node_modules/") &&
    pathname.indexOf("es-module-shims.js") < 0
  ) {
    try {
      await init();
      const body = await fs.readFile(url, "utf-8");
      await parse(body);

      isCommonJs = true;
    } catch (e) {
      const { message } = e;
      const isProbablyLexarErrorSoIgnore =
        message.indexOf("Unexpected import statement in CJS module.") >= 0 ||
        message.indexOf("Unexpected export statement in CJS module.") >= 0;

      if (!isProbablyLexarErrorSoIgnore) {
        // we probably _shouldn't_ ignore this, so let's log it since we don't want to swallow all errors
        console.error(e);
      }
    }
  }

  return isCommonJs;
};

class ImportCommonJsResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldIntercept(url) {
    return await testForCjsModule(url);
  }

  async intercept(url, request, response) {
    const { pathname } = url;

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          input: pathname,
<<<<<<< HEAD
          output: { format: "esm" },
          plugins: [commonjs()],
=======
          output: { format: 'esm' },
          plugins: [
            // @ts-expect-error see https://github.com/rollup/plugins/issues/1662
            commonjs()
          ]
>>>>>>> d74799f4 (WIP)
        };
        // @ts-expect-error see https://github.com/rollup/plugins/issues/1662
        const stream = rollupStream(options);
        let bundle = "";

        stream.on("data", (data) => (bundle += data));
        stream.on("end", () => {
          console.debug(`processed module "${pathname}" as a CommonJS module type.`);
          resolve(
            new Response(bundle, {
              headers: response.headers,
            }),
          );
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginImportCommonJs = (options = {}) => {
<<<<<<< HEAD
  return [
    {
      type: "resource",
      name: "plugin-import-commonjs:resource",
      provider: (compilation) => new ImportCommonJsResource(compilation, options),
    },
    {
      type: "rollup",
      name: "plugin-import-commonjs:rollup",
      provider: () => [commonjs()],
    },
  ];
=======
  return [{
    type: 'resource',
    name: 'plugin-import-commonjs:resource',
    provider: (compilation) => new ImportCommonJsResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-commonjs:rollup',
    provider: () => [
      // @ts-expect-error see https://github.com/rollup/plugins/issues/1662
      commonjs()
    ]
  }];
>>>>>>> d74799f4 (WIP)
};

export { greenwoodPluginImportCommonJs };
