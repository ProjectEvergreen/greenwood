/*
 * Use Case
 * Run Greenwood with the Vercel adapter plugin and custom base path.
 *
 * User Result
 * Should generate a static Greenwood build with serverless and edge functions output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterVercel } from '@greenwood/plugin-adapter-vercel';
 *
 * {
 *   baseOath: '/my-app',
 *   plugins: [{
 *     greenwoodPluginAdapterVercel()
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { checkResourceExists } from "../../../../cli/src/lib/resource-utils.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Vercel Adapter plugin output and custom base path";
  const basePath = "/my-app";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const vercelOutputFolder = new URL("./.vercel/output/", import.meta.url);
  const vercelFunctionsOutputUrl = new URL("./functions/", vercelOutputFolder);
  let runner;

  before(async function () {
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
      let configFile;
      let functionFolders;

      before(async function () {
        configFile = await fs.readFile(new URL("./config.json", vercelOutputFolder), "utf-8");
        functionFolders = await glob.promise(
          fileURLToPath(new URL("./**/*.func", vercelFunctionsOutputUrl)),
        );
      });

      it("should output the expected number of serverless function output folders", function () {
        expect(functionFolders.length).to.be.equal(2);
      });

      it("should output the expected configuration file for the build output", function () {
        expect(configFile).to.be.equal('{"version":3}');
      });

      it("should output the expected package.json for each serverless function", function () {
        functionFolders.forEach(async (folder) => {
          const packageJson = await fs.readFile(
            new URL("./package.json", pathToFileURL(`${folder}/`)),
            "utf-8",
          );

          expect(packageJson).to.be.equal('{"type":"module"}');
        });
      });

      it("should output the expected .vc-config.json for each serverless function", function () {
        functionFolders.forEach(async (folder) => {
          const packageJson = await fs.readFile(
            new URL("./vc-config.json", pathToFileURL(`${folder}/`)),
            "utf-8",
          );

          expect(packageJson).to.be.equal(
            '{"runtime":"nodejs18.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":true}',
          );
        });
      });
    });

    describe("Static directory output", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const publicFiles = await glob.promise(fileURLToPath(new URL("public/**/**", outputUrl)));

        for (const file of publicFiles) {
          const buildOutputDestination = file.replace(
            fileURLToPath(new URL("public", outputUrl)),
            fileURLToPath(new URL("static", vercelOutputFolder)),
          );
          const itExists = await checkResourceExists(pathToFileURL(buildOutputDestination));

          expect(itExists).to.be.equal(true);
        }
      });
    });

    describe("Greeting API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(
            new URL(`./${basePath}/api/greeting.func/index.js`, vercelFunctionsOutputUrl)
          )
        ).default;
        const param = "Greenwood";
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `http://www.example.com/${basePath}/api/greeting?name=${param}`,
            headers: {
              host: "http://www.example.com",
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

        expect(status).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("application/json");
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });
    });

    describe("Users SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL(`./${basePath}/users.func/index.js`, vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };
        const count = 1;

        await handler(
          {
            url: `http://www.example.com/${basePath}/users/`,
            headers: {
              host: "http://www.example.com",
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
        const cardTags = dom.window.document.querySelectorAll("body > article");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(status).to.be.equal(200);
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Users: ${count}`);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });
    });
  });

  after(async function () {
    await runner.teardown([new URL(".vercel", outputUrl), ...getOutputTeardownFiles(outputUrl)]);
  });
});
