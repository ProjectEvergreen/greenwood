/*
 * Use Case
 * Run Greenwood with the Netlify adapter plugin and a custom base path set.
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
 *   baseOath: '/my-app',
 *   plugins: [{
 *     greenwoodPluginAdapterNetlify()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   pages/
 *     api/
 *       greeting.js
 *     users.js
 */
import chai from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { normalizePathnameForWindows } from "../../../../cli/src/lib/resource-utils.js";
import extract from "extract-zip";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Netlify Adapter plugin output w/ base path configuration";
  const basePath = "/my-app";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const netlifyFunctionsOutputUrl = new URL("./netlify/functions/", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    describe("Default Output", function () {
      let zipFiles;
      let redirectsFile;

      before(async function () {
        zipFiles = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
        );
        redirectsFile = await glob.promise(path.join(outputPath, "public/_redirects"));
      });

      it("should output the expected number of serverless function zip files", function () {
        expect(zipFiles.length).to.be.equal(2);
      });

      it("should output the expected number of serverless function API zip files", function () {
        expect(
          zipFiles.filter((file) => path.basename(file).startsWith("api-")).length,
        ).to.be.equal(1);
      });

      it("should output the expected number of serverless function SSR page zip files", function () {
        expect(
          zipFiles.filter((file) => !path.basename(file).startsWith("api-")).length,
        ).to.be.equal(1);
      });

      it("should output a _redirects file", function () {
        expect(redirectsFile.length).to.be.equal(1);
      });
    });

    describe("Greeting API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "api-greeting.zip"),
        );
      });

      it("should output one API route as a serverless function zip file", function () {
        expect(apiFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const param = "Greenwood";
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(apiFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `http://www.example.com/${basePath}api/greeting?name=${param}`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("application/json");
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });
    });

    describe("Users SSR Page adapter", function () {
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile).startsWith("users"));
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");
        const count = 1;

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `http://www.example.com/${basePath}users/`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const articleTags = dom.window.document.querySelectorAll("body > article");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");
        expect(articleTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Users: ${count}`);
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
          `${basePath}/users/ /.netlify/functions/users 200
${basePath}/api/greeting /.netlify/functions/api-greeting 200
`,
        );
      });
    });
  });

  after(function () {
    runner.teardown([path.join(outputPath, "netlify"), ...getOutputTeardownFiles(outputPath)]);
  });
});
