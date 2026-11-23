/*
 * Use Case
 * Run Greenwood with the AWS adapter plugin that uses dynamic file-based routing.
 *
 * User Result
 * Should generate a static Greenwood build with serverless and edge functions output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterAws } from '@greenwood/plugin-adapter-aws';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginAdapterAws()
 *   }]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     api/
 *       product/
 *         [id].js
 *     artists/
 *       [name].js # uses getStaticPaths
 *     blog/
 *       [slug].js
 *     event/
 *       title.js # has staticExport = true
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "AWS Adapter plugin output";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const awsOutputFolder = new URL("./.aws-output/", import.meta.url);
  const awsApiFunctionsOutputUrl = new URL("./api/", awsOutputFolder);
  const awsRouteFunctionsOutputUrl = new URL("./routes/", awsOutputFolder);
  const hostname = "http://www.example.com";
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    describe("Default Output", function () {
      let functionFolders;
      let routeFolders;

      before(async function () {
        functionFolders = await glob.promise(fileURLToPath(new URL("./api/*", awsOutputFolder)));
        routeFolders = await glob.promise(fileURLToPath(new URL("./routes/*", awsOutputFolder)));
      });

      it("should output the expected number of serverless function output folders for SSR pages", function () {
        expect(routeFolders.length).to.be.equal(1);
      });

      it("should output the expected number of serverless function output folders for API routes", function () {
        expect(functionFolders.length).to.be.equal(1);
      });

      it("should output the expected package.json for each serverless function", function () {
        [...functionFolders, ...routeFolders].forEach(async (folder) => {
          const packageJson = await fs.readFile(
            new URL("./package.json", `file://${folder}/`),
            "utf-8",
          );

          expect(packageJson).to.be.equal('{"type":"module"}');
        });
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1737
    describe("An SSR page using getStaticPaths for its dynamic route segment", function () {
      let staticPathsRouteFolders;

      before(async function () {
        staticPathsRouteFolders = await glob.promise(
          fileURLToPath(new URL("./routes/artists*", awsOutputFolder)),
        );
      });

      // non-enumerated values have no function to route to and fall through
      // to the platform's static 404
      it("should not output a serverless function folder for the route", function () {
        expect(staticPathsRouteFolders.length).to.equal(0);
      });

      it("should output static HTML for each path enumerated from getStaticPaths", async function () {
        for (const name of ["foo", "bar", "baz"]) {
          const html = await fs.readFile(
            new URL(`public/artists/${encodeURIComponent(name)}/index.html`, outputUrl),
            "utf-8",
          );

          expect(html).to.contain("Some Artists Page");
        }
      });
    });

    describe("A Dynamic SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked with a dynamic path segment", async function () {
        const { handler } = await import(
          new URL("./blog--slug-/index.js", awsRouteFunctionsOutputUrl)
        );
        const slug = "my-first-blog-post";
        const { statusCode, body, headers } = await handler({
          rawPath: `/blog/${slug}/`,
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        const dom = new JSDOM(body);
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers["content-type"]).to.be.equal("text/html");
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(slug);
      });
    });

    describe("A Dynamic API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(
          new URL("./product--id-/index.js", awsApiFunctionsOutputUrl)
        );
        const param = 33;
        const { statusCode, body } = await handler({
          rawPath: `/api/product/${param}`,
          headers: {
            host: hostname,
          },
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        expect(statusCode).to.be.equal(200);
        expect(body).to.be.equal(`Product id is => ${param}`);
      });
    });
  });

  after(async function () {
    await runner.teardown([
      new URL(".aws-output", outputUrl),
      ...getOutputTeardownFiles(outputUrl),
    ]);
  });
});
