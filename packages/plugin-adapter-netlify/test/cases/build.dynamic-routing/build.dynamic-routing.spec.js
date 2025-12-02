/*
 * Use Case
 * Run Greenwood with the Netlify adapter plugin that uses dynamic file-based routing.
 *
 * User Result
 * Should generate a static Greenwood build with serverless and edge functions output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterNetlify } from '@greenwood/plugin-adapter-netlify';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginAdapterNetlify()
 *   }]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     api/
 *       product/
 *         [id].ts
 *     blog/
 *       [slug].ts
 */
import chai from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { normalizePathnameForWindows } from "../../../../cli/src/lib/resource-utils.js";
import extract from "extract-zip";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Netlify Adapter plugin output";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const netlifyFunctionsOutputUrl = new URL("./netlify/functions/", import.meta.url);
  const hostname = "http://www.example.com";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    describe("Default Output", function () {
      let zipFiles;
      let redirectsFile;

      before(async function () {
        zipFiles = await Array.fromAsync(fs.glob("*.zip", { cwd: netlifyFunctionsOutputUrl }));
        redirectsFile = await Array.fromAsync(fs.glob("public/_redirects", { cwd: outputPath }));
      });

      it("should have the expected number of generated zip files for each function", function () {
        expect(zipFiles.length).to.be.equal(2);
      });

      it("should output the expected number of serverless function API zip files", function () {
        expect(
          zipFiles.filter((file) => path.basename(file).startsWith("api-")).length,
        ).to.be.equal(1);
      });

      it("should output the expected number of serverless function SSR page zip files", function () {
        expect(zipFiles.filter((file) => !path.basename(file).includes("api-")).length).to.be.equal(
          1,
        );
      });

      it("should output a _redirects file", function () {
        expect(redirectsFile.length).to.be.equal(1);
      });
    });

    describe("A Dynamic API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await Array.fromAsync(
          fs.glob("api-product--id-.zip", { cwd: netlifyFunctionsOutputUrl }),
        );
      });

      it("should output one API route as a serverless function zip file", function () {
        expect(apiFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const param = 33;
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(new URL(`./${apiFunctions[0]}`, netlifyFunctionsOutputUrl), {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/api/product/${param}`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body } = response;

        expect(statusCode).to.be.equal(200);
        expect(body).to.be.equal(`Product id is => ${param}`);
      });
    });

    describe("A Dynamic SSR Page adapter", function () {
      const slug = "my-first-blog-post";
      let pageFunctions;

      before(async function () {
        pageFunctions = await Array.fromAsync(
          fs.glob("blog--slug-.zip", { cwd: netlifyFunctionsOutputUrl }),
        );
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");

        await extract(new URL(`./${pageFunctions[0]}`, netlifyFunctionsOutputUrl), {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/blog/${slug}/`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(slug);
      });
    });

    describe("_redirects file contents", function () {
      let redirectsFileContents;

      before(async function () {
        redirectsFileContents = await fs.readFile(
          path.join(outputPath, "public/_redirects"),
          "utf-8",
        );
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        expect(redirectsFileContents).to.be.equal(
          `/blog/:slug /.netlify/functions/blog--slug- 200
/api/product/:id /.netlify/functions/api-product--id- 200
`,
        );
      });
    });
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, "netlify"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
