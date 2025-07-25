/*
 * Use Case
 * Run Greenwood with the Vercel adapter plugin.
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
 *   plugins: [{
 *     greenwoodPluginAdapterVercel()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       fragment.js
 *       greeting.js
 *       search.js
 *       submit-form-data.js
 *       submit-json.js
 *     blog/
 *       first-post.js
 *       index.js
 *     artists.js
 *     index.js
 *     post.js
 *     users.js
 *   services/
 *     artists.js
 *     greeting.js
 */
import chai from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import {
  checkResourceExists,
  normalizePathnameForWindows,
} from "../../../../cli/src/lib/resource-utils.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Vercel Adapter plugin output";
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    describe("Default Output", function () {
      let configFile;
      let functionFolders;

      before(async function () {
        configFile = await fs.readFile(new URL("./config.json", vercelOutputFolder), "utf-8");
        functionFolders = await glob.promise(
          path.join(normalizePathnameForWindows(vercelFunctionsOutputUrl), "**/*.func"),
        );
      });

      it("should output the expected number of serverless function output folders", function () {
        expect(functionFolders.length).to.be.equal(12);
      });

      it("should output the expected configuration file for the build output", function () {
        expect(configFile).to.be.equal('{"version":3}');
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

    describe("Static directory output", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const publicFiles = await glob.promise(path.join(outputPath, "public/**/**"));

        for (const file of publicFiles) {
          const buildOutputDestination = file.replace(
            path.join(outputPath, "public"),
            path.join(vercelOutputFolder.pathname, "static"),
          );
          const itExists = await checkResourceExists(new URL(`file://${buildOutputDestination}`));

          expect(itExists).to.be.equal(true);
        }
      });
    });

    describe("Greeting API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/greeting.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const param = "Greenwood";
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/greeting?name=${param}`,
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

        expect(status).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("application/json");
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });

      it("should not have a shared asset for the card component", async () => {
        const assets = await glob.promise(
          path.join(normalizePathnameForWindows(vercelFunctionsOutputUrl), "/api/greeting.func/*"),
        );
        const exists = assets.find((asset) => {
          const name = asset.split("/").pop();
          return name.startsWith("card") && name.endsWith(".js");
        });

        expect(!!exists).to.equal(false);
      });
    });

    describe("Fragments API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/fragment.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/fragment`,
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
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(status).to.be.equal(200);
        expect(cardTags.length).to.be.equal(2);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have a route chunk", async () => {
        const chunks = await glob.promise(
          path.join(
            normalizePathnameForWindows(vercelFunctionsOutputUrl),
            "/api/fragment.func/fragment.*.js",
          ),
        );

        expect(chunks.length).to.equal(1);
      });
    });

    describe("Submit JSON API Route adapter", function () {
      const name = "Greenwood";

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/submit-json.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/submit-json`,
            headers: {
              host: hostname,
              "content-type": "application/json",
            },
            body: { name },
            method: "POST",
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
        expect(JSON.parse(body).message).to.be.equal(`Thank you ${name} for your submission!`);
        expect(headers.get("Content-Type")).to.be.equal("application/json");
        expect(headers.get("x-secret")).to.be.equal("1234");
      });
    });

    describe("Submit FormData JSON API Route adapter", function () {
      const name = "Greenwood";

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/submit-form-data.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/submit-form-data`,
            headers: {
              host: hostname,
              "content-type": "application/x-www-form-urlencoded",
            },
            body: { name },
            method: "POST",
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
        expect(body).to.be.equal(`Thank you ${name} for your submission!`);
        expect(headers.get("Content-Type")).to.be.equal("text/html");
      });
    });

    describe("Search API Route adapter", function () {
      const term = "Analog";

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/search.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/search`,
            headers: {
              host: hostname,
              "content-type": "application/x-www-form-urlencoded",
            },
            body: { term },
            method: "POST",
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
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(status).to.be.equal(200);
        expect(headers.get("Content-Type")).to.be.equal("text/html");

        expect(cardTags.length).to.be.equal(1);
      });
    });

    describe("Nested API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./api/nested/endpoint.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/api/nested/endpoint`,
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
        expect(headers.get("Content-Type")).to.be.equal("text/html");
        expect(body).to.be.equal("I am a nested API route!");
      });
    });

    describe("Artists SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (await import(new URL("./artists.func/index.js", vercelFunctionsOutputUrl)))
          .default;
        const response = {
          headers: new Headers(),
        };
        const count = 2;

        await handler(
          {
            url: `${hostname}/artists`,
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
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(status).to.be.equal(200);
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Artists: ${count}`);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });
    });

    describe("Blog Index (collision test) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (await import(new URL("./blog.func/index.js", vercelFunctionsOutputUrl)))
          .default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/blog/`,
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
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal("duplicated nested SSR page should work!");
      });
    });

    describe("Blog First Post (nested) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (
          await import(new URL("./blog/first-post.func/index.js", vercelFunctionsOutputUrl))
        ).default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/blog/first-post/`,
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
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal("Nested SSR First Post page should work!");
      });
    });

    describe("Index (collision test) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (await import(new URL("./index.func/index.js", vercelFunctionsOutputUrl)))
          .default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/`,
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
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal("Just here causing trouble! :D");
      });
    });

    describe("Users SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (await import(new URL("./users.func/index.js", vercelFunctionsOutputUrl)))
          .default;
        const response = {
          headers: new Headers(),
        };
        const count = 1;

        await handler(
          {
            url: `${hostname}/users`,
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
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(status).to.be.equal(200);
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Users: ${count}`);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });
    });

    describe("Post SSR Page adapter", function () {
      const postId = 1;

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const handler = (await import(new URL("./post.func/index.js", vercelFunctionsOutputUrl)))
          .default;
        const response = {
          headers: new Headers(),
        };

        await handler(
          {
            url: `${hostname}/post/?id=${postId}`,
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
        const headingOne = dom.window.document.querySelectorAll("body > h1");
        const headingTwo = dom.window.document.querySelectorAll("body > h2");
        const paragraph = dom.window.document.querySelectorAll("body > p");

        expect(status).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headingOne.length).to.be.equal(1);
        expect(headingTwo.length).to.be.equal(1);
        expect(paragraph.length).to.be.equal(1);

        expect(headingOne[0].textContent).to.be.equal(`Fetched Post ID: ${postId}`);
        expect(headingTwo[0].textContent).to.not.be.undefined;
        expect(paragraph[0].textContent).to.not.be.undefined;
      });
    });
  });

  after(function () {
    runner.teardown([path.join(outputPath, ".vercel"), ...getOutputTeardownFiles(outputPath)]);
  });
});
