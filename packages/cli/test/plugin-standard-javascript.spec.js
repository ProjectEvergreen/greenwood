import { expect } from "chai";
import { greenwoodPluginStandardJavascript } from "../src/plugins/resource/plugin-standard-javascript.js";

describe("JavaScript import attributes polyfill", function () {
  const resource = greenwoodPluginStandardJavascript[0].provider({
    config: { polyfills: { importAttributes: ["css", "json"] } },
  });
  const url = new URL("./fixture.js", import.meta.url);

  async function polyfill(source) {
    const response = await resource.preIntercept(url, new Request(url), new Response(source));

    return response.text();
  }

  for (const type of ["css", "json"]) {
    for (const specifier of [
      "inlineCSS",
      "'./' + filename",
      "`./theme.css`",
      "`./${filename}`",
      "getSpecifier()",
      "42",
      "null",
    ]) {
      it(`should preserve the specifier and ${type} attributes for import(${specifier})`, async function () {
        const source = `import(${specifier}, { with: { type: "${type}" } });`;

        expect(await polyfill(source)).to.equal(source);
      });
    }
  }

  it("should still polyfill string literal imports alongside expression imports", async function () {
    const source = [
      'import sheet from "./theme.css" with { type: "css" };',
      "import('./data.json', { with: { type: 'json' } });",
      'import(inlineCSS, { with: { type: "css" } });',
    ].join("\n");
    const expected = [
      'import sheet from "./theme.css?polyfill=type-css";',
      "import('./data.json?polyfill=type-json');",
      'import(inlineCSS, { with: { type: "css" } });',
    ].join("\n");

    expect(await polyfill(source)).to.equal(expected);
  });
});
