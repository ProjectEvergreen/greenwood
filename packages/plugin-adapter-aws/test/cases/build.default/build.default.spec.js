/*
 * Use Case
 * Run Greenwood with the AWS adapter plugin.
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
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { normalizePathnameForWindows } from "../../../../cli/src/lib/resource-utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "AWS Adapter plugin output";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
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
        expect(functionFolders.length).to.be.equal(6);
      });

      it("should output the expected number of serverless function output folders for API routes", function () {
        expect(routeFolders.length).to.be.equal(6);
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

    describe("Greeting API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(new URL("./greeting/index.js", awsApiFunctionsOutputUrl));
        const param = "Greenwood";
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/greeting`,
          rawQueryString: `name=${param}`,
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
        expect(headers["content-type"]).to.be.equal("application/json");
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });

      it("should not have a shared asset for the card component", async () => {
        const assets = await glob.promise(
          path.join(normalizePathnameForWindows(awsApiFunctionsOutputUrl), "/greeting/*"),
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
        const { handler } = await import(new URL("./fragment/index.js", awsApiFunctionsOutputUrl));
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/fragment`,
          headers: {
            host: hostname,
          },
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(statusCode).to.be.equal(200);
        expect(cardTags.length).to.be.equal(2);
        expect(headers["content-type"]).to.be.equal("text/html");
      });

      it("should have a route chunk", async () => {
        const chunks = await glob.promise(
          path.join(
            normalizePathnameForWindows(awsApiFunctionsOutputUrl),
            "/fragment/fragment.*.js",
          ),
        );

        expect(chunks.length).to.equal(1);
      });
    });

    describe("Submit JSON API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = "Greenwood";
        const { handler } = await import(
          new URL("./submit-json/index.js", awsApiFunctionsOutputUrl)
        );
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/submit-json`,
          headers: {
            host: hostname,
            "content-type": "application/json",
          },
          body: JSON.stringify({ name }),
          requestContext: {
            http: {
              method: "POST",
            },
          },
        });

        expect(statusCode).to.be.equal(200);
        expect(JSON.parse(body).message).to.be.equal(`Thank you ${name} for your submission!`);
        expect(headers["content-type"]).to.be.equal("application/json");
        expect(headers["x-secret"]).to.be.equal("1234");
      });
    });

    describe("Submit FormData JSON API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = "Greenwood";
        const { handler } = await import(
          new URL("./submit-form-data/index.js", awsApiFunctionsOutputUrl)
        );
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/submit-form-data`,
          headers: {
            host: hostname,
            "content-type": "application/x-www-form-urlencoded",
          },
          isBase64Encoded: true,
          body: btoa(`name=${name}`),
          requestContext: {
            http: {
              method: "POST",
            },
          },
        });

        expect(statusCode).to.be.equal(200);
        expect(body).to.be.equal(`Thank you ${name} for your submission!`);
        expect(headers["content-type"]).to.be.equal("text/html");
      });
    });

    describe("Search API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const term = "Analog";
        const { handler } = await import(new URL("./search/index.js", awsApiFunctionsOutputUrl));
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/search`,
          headers: {
            host: hostname,
            "content-type": "application/x-www-form-urlencoded",
          },
          isBase64Encoded: true,
          body: btoa(`term=${term}`),
          requestContext: {
            http: {
              method: "POST",
            },
          },
        });

        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(statusCode).to.be.equal(200);
        expect(headers["content-type"]).to.be.equal("text/html");
        expect(cardTags.length).to.be.equal(1);
      });
    });

    describe("Nested API Route adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(
          new URL("./nested-endpoint/index.js", awsApiFunctionsOutputUrl)
        );
        const { statusCode, body, headers } = await handler({
          rawPath: `/api/nested/endpoint`,
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        expect(statusCode).to.be.equal(200);
        expect(headers["content-type"]).to.be.equal("text/html");
        expect(body).to.be.equal("I am a nested API route!");
      });
    });

    describe("Artists SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(new URL("./artists/index.js", awsRouteFunctionsOutputUrl));
        const count = 2;
        const { statusCode, body, headers } = await handler({
          rawPath: `/artists/`,
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Artists: ${count}`);
        expect(headers["content-type"]).to.be.equal("text/html");
      });
    });

    describe("Blog Index (collision test) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(
          new URL("./blog-index/index.js", awsRouteFunctionsOutputUrl)
        );
        const { statusCode, body, headers } = await handler({
          rawPath: `/blog/`,
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
        expect(headings[0].textContent).to.be.equal("duplicated nested SSR page should work!");
      });
    });

    describe("Blog First Post (nested) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(
          new URL("./blog-first-post/index.js", awsRouteFunctionsOutputUrl)
        );
        const { statusCode, body, headers } = await handler({
          rawPath: `/blog/first-post/`,
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
        expect(headings[0].textContent).to.be.equal("Nested SSR First Post page should work!");
      });
    });

    describe("Index (collision test) SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(new URL("./index/index.js", awsRouteFunctionsOutputUrl));
        const { statusCode, body, headers } = await handler({
          rawPath: `/`,
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
        expect(headings[0].textContent).to.be.equal("Just here causing trouble! :D");
      });
    });

    describe("Users SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const { handler } = await import(new URL("./users/index.js", awsRouteFunctionsOutputUrl));
        const count = 1;
        const { statusCode, body, headers } = await handler({
          rawPath: `/users/`,
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Users: ${count}`);
        expect(headers["content-type"]).to.be.equal("text/html");
      });
    });

    describe("Post SSR Page adapter", function () {
      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const postId = 1;
        const { handler } = await import(new URL("./post/index.js", awsRouteFunctionsOutputUrl));
        const { statusCode, body, headers } = await handler({
          rawPath: `/post/`,
          rawQueryString: `id=${postId}`,
          requestContext: {
            http: {
              method: "GET",
            },
          },
        });

        const dom = new JSDOM(body);
        const headingOne = dom.window.document.querySelectorAll("body > h1");
        const headingTwo = dom.window.document.querySelectorAll("body > h2");
        const paragraph = dom.window.document.querySelectorAll("body > p");

        expect(statusCode).to.be.equal(200);
        expect(headers["content-type"]).to.be.equal("text/html");

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
    runner.teardown([path.join(outputPath, ".aws-output"), ...getOutputTeardownFiles(outputPath)]);
  });
});
