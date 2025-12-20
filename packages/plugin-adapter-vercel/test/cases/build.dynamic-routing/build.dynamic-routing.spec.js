/*
 * Use Case
 * Run Greenwood with SSR routes and API route that uses dynamic file-based routing.
 *
 * User Result
 * Should serve a Greenwood project that can handle dynamic segments in page and API routes.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
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

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Vercel Adapter with Dynamic Routing";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const vercelOutputFolder = new URL("./.vercel/output/", import.meta.url);
  const vercelFunctionsOutputUrl = new URL("./functions/", vercelOutputFolder);
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
      let configFile;
      let functionFolders;

      before(async function () {
        configFile = await fs.readFile(new URL("./config.json", vercelOutputFolder), "utf-8");
        functionFolders = await Array.fromAsync(
          fs.glob("**/*.func", { cwd: vercelFunctionsOutputUrl }),
        );
      });

      it("should output the expected number of serverless function output folders", function () {
        expect(functionFolders.length).to.be.equal(2);
      });

      it("should output the expected configuration file for the build output", function () {
        expect(configFile).to.be.equal(
          '{"version":3,"routes":[{"src":"/blog/(?<slug>[^/]+)/","dest":"/blog/[slug]"},{"src":"/api/product/(?<id>[^/]+)","dest":"/api/product/[id]"}]}',
        );
      });

      it("should output the expected package.json for each serverless function", function () {
        functionFolders.forEach(async (folder) => {
          const packageJson = await fs.readFile(
            new URL("./package.json", `file://${folder}/`),
            "utf-8",
          );

          expect(packageJson).to.be.equal('{"type":"module"}');
        });
      });

      it("should output the expected .vc-config.json for each serverless function", function () {
        functionFolders.forEach(async (folder) => {
          const packageJson = await fs.readFile(
            new URL("./vc-config.json", `file://${folder}/`),
            "utf-8",
          );

          expect(packageJson).to.be.equal(
            '{"runtime":"nodejs20.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":true}',
          );
        });
      });
    });

    describe("An SSR page with a dynamic route segment", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./blog/[slug].func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };
        const slug = "my-first-blog-post";

        await handler(
          {
            url: `${hostname}/blog/${slug}/`,
            headers: {
              host: hostname,
            },
            method: "GET",
          },
          {
            status: function (code) {
              response.status = code;
            },
            send: function (body) {
              response.body = body;
            },
            setHeader: function (key, value) {
              response.headers.set(key, value);
            },
          },
        );

        const { status, body, headers } = response;
        const dom = new JSDOM(body);
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(status).to.be.equal(200);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(slug);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });
    });

    describe("Dynamic API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/product/[id].func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const param = 33;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/product/${param}`,
            headers: {
              host: hostname,
            },
            method: "GET",
          },
          {
            status: function (code) {
              response.status = code;
            },
            send: function (body) {
              response.body = body;
            },
            setHeader: function (key, value) {
              response.headers.set(key, value);
            },
          },
        );
        const { status, body } = response;

        expect(status).to.be.equal(200);
        expect(body).to.be.equal(`Product id is => ${param}`);
      });
    });
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".vercel"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
