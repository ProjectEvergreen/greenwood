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
 *         [id].ts
 *     blog/
 *       [slug].ts
 */
import chai from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { normalizePathnameForWindows } from "../../../../cli/src/lib/resource-utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "AWS Adapter plugin output";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const awsOutputFolder = new URL("./.aws-output/", import.meta.url);
  const awsApiFunctionsOutputUrl = new URL("./api/", awsOutputFolder);
  const awsRouteFunctionsOutputUrl = new URL("./routes/", awsOutputFolder);
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
      let functionFolders;
      let routeFolders;

      before(async function () {
        functionFolders = await glob.promise(
          path.join(normalizePathnameForWindows(awsOutputFolder), "api/*"),
        );
        routeFolders = await glob.promise(
          path.join(normalizePathnameForWindows(awsOutputFolder), "routes/*"),
        );
      });

      it("should output the expected number of serverless function output folders for SSR pages", function () {
        expect(functionFolders.length).to.be.equal(1);
      });

      it("should output the expected number of serverless function output folders for API routes", function () {
        expect(routeFolders.length).to.be.equal(1);
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
      path.join(outputPath, ".aws-output"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
