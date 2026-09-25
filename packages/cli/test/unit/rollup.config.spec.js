import { expect } from "chai";
import { fileURLToPath } from "node:url";
import { getRollupConfigForSsrPages } from "../../src/config/rollup.config.js";

describe("Unit Test: Rollup Configuration", function () {
  it("should preserve dollar signs in emitted file reference IDs", async function () {
    const inputPath = fileURLToPath(import.meta.url);
    const compilation = {
      config: {
        plugins: [
          {
            type: "resource",
            provider: () => ({
              shouldIntercept: () => true,
              intercept: (url, request, response) => response,
            }),
          },
        ],
      },
      context: {
        apisDir: new URL("./api/", import.meta.url),
        outputDir: new URL("./public/", import.meta.url),
        pagesDir: new URL("./pages/", import.meta.url),
      },
      manifest: {
        apis: new Map(),
      },
    };
    const [config] = await getRollupConfigForSsrPages(compilation, [{ id: "index", inputPath }]);
    const plugin = config.plugins.find(({ name }) => name === "greenwood-import-meta-url");
    const code = `
      const doubleQuoted = new URL("./rollup.config.spec.js", import.meta.url);
      const singleQuoted = new URL('./rollup.config.spec.js', import.meta.url);
    `;
    const importRef = "import.meta.ROLLUP_FILE_URL_BMdX$$cv";
    const result = await plugin.transform.call(
      {
        emitFile: () => "BMdX$$cv",
      },
      code,
      inputPath,
    );

    expect(result.code).to.equal(`
      const doubleQuoted = new URL(${importRef}, import.meta.url);
      const singleQuoted = new URL(${importRef}, import.meta.url);
    `);
  });
});
