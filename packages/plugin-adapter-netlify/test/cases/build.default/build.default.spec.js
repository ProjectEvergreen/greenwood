/*
 * Use Case
 * Run Greenwood with the Netlify adapter plugin.
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

      it("", function () {
        expect(zipFiles.length).to.be.equal(12);
      });

      it("should output the expected number of serverless function API zip files", function () {
        expect(
          zipFiles.filter((file) => path.basename(file).startsWith("api-")).length,
        ).to.be.equal(6);
      });

      it("should output the expected number of serverless function SSR page zip files", function () {
        expect(zipFiles.filter((file) => !path.basename(file).includes("api-")).length).to.be.equal(
          6,
        );
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
            rawUrl: `${hostname}/api/greeting?name=${param}`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("application/json");
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });

      it("should not have a shared asset for the card component", async () => {
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(apiFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });

        const assets = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), `/${name}/*`),
        );
        const exists = assets.find((asset) => {
          const name = asset.split("/").pop();
          return name.startsWith("card") && name.endsWith(".js");
        });

        expect(!!exists).to.equal(false);
      });
    });

    describe("Fragments API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "api-fragment.zip"),
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
            rawUrl: `${hostname}/api/greeting?name=${param}`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(statusCode).to.be.equal(200);
        expect(cardTags.length).to.be.equal(2);
        expect(headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have a route chunk", async () => {
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(apiFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });

        const chunks = await glob.promise(
          path.join(
            normalizePathnameForWindows(netlifyFunctionsOutputUrl),
            `/${name}/${name.replace("api-", "")}.*.js`,
          ),
        );

        expect(chunks.length).to.equal(1);
      });
    });

    describe("Submit JSON API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "api-submit-json.zip"),
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
            rawUrl: `${hostname}/api/submit-json`,
            body: JSON.stringify({ name: param }),
            httpMethod: "POST",
            headers: {
              "content-type": "application/json",
            },
          },
          {},
        );
        const { statusCode, body, headers } = response;

        expect(statusCode).to.be.equal(200);
        expect(JSON.parse(body).message).to.be.equal(`Thank you ${param} for your submission!`);
        expect(headers.get("Content-Type")).to.be.equal("application/json");
        expect(headers.get("x-secret")).to.be.equal("1234");
      });
    });

    describe("Submit FormData API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(
            normalizePathnameForWindows(netlifyFunctionsOutputUrl),
            "api-submit-form-data.zip",
          ),
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
            rawUrl: `${hostname}/api/submit-form-data`,
            body: `name=${param}`,
            httpMethod: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
          },
          {},
        );
        const { statusCode, body, headers } = response;

        expect(statusCode).to.be.equal(200);
        expect(body).to.be.equal(`Thank you ${param} for your submission!`);
        expect(headers.get("Content-Type")).to.be.equal("text/html");
      });
    });

    describe("Search API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "api-search.zip"),
        );
      });

      it("should output one API route as a serverless function zip file", function () {
        expect(apiFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const param = "Analog";
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(apiFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/api/search`,
            body: `term=${param}`,
            httpMethod: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("app-card");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(cardTags.length).to.be.equal(1);
      });
    });

    describe("Nested API Route adapter", function () {
      let apiFunctions;

      before(async function () {
        apiFunctions = await glob.promise(
          path.join(
            normalizePathnameForWindows(netlifyFunctionsOutputUrl),
            "api-nested-endpoint.zip",
          ),
        );
      });

      it("should output one API route as a serverless function zip file", function () {
        expect(apiFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(apiFunctions[0]).replace(".zip", "");

        await extract(apiFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/api/nested/endpoint`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(body).to.be.equal("I am a nested API route!");
      });
    });

    describe("Index (collision testing) SSR Page adapter", function () {
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile) === "index.zip");
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/`,
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
        expect(headings[0].textContent).to.be.equal("Just here causing trouble! :D");
      });
    });

    describe("Artists SSR Page adapter", function () {
      const count = 2;
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile).startsWith("artists"));
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/artists/`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Artists: ${count}`);
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
            rawUrl: `${hostname}/users/`,
            httpMethod: "GET",
          },
          {},
        );
        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const cardTags = dom.window.document.querySelectorAll("body > app-card");
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");
        expect(cardTags.length).to.be.equal(count);
        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal(`List of Users: ${count}`);
      });
    });

    describe("Post SSR Page adapter", function () {
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile).startsWith("post"));
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");
        const postId = 1;

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/post/?id=${postId}`,
            httpMethod: "GET",
          },
          {},
        );

        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const headingOne = dom.window.document.querySelectorAll("body > h1");
        const headingTwo = dom.window.document.querySelectorAll("body > h2");
        const paragraph = dom.window.document.querySelectorAll("body > p");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headingOne.length).to.be.equal(1);
        expect(headingTwo.length).to.be.equal(1);
        expect(paragraph.length).to.be.equal(1);

        expect(headingOne[0].textContent).to.be.equal(`Fetched Post ID: ${postId}`);
        expect(headingTwo[0].textContent).to.not.be.undefined;
        expect(paragraph[0].textContent).to.not.be.undefined;
      });
    });

    describe("Blog Index (collision test) SSR Page adapter", function () {
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile).startsWith("blog-index"));
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/blog/`,
            httpMethod: "GET",
          },
          {},
        );

        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const headingOne = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headingOne.length).to.be.equal(1);

        expect(headingOne[0].textContent).to.be.equal("nested SSR page should work!");
      });
    });

    describe("Blog First Post (nested page) SSR Page adapter", function () {
      let pageFunctions;

      before(async function () {
        pageFunctions = (
          await glob.promise(
            path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), "*.zip"),
          )
        ).filter((zipFile) => path.basename(zipFile).startsWith("blog-first-post"));
      });

      it("should output one SSR page as a serverless function zip file", function () {
        expect(pageFunctions.length).to.be.equal(1);
      });

      it("should return the expected response when the serverless adapter entry point handler is invoked", async function () {
        const name = path.basename(pageFunctions[0]).replace(".zip", "");

        await extract(pageFunctions[0], {
          dir: path.join(normalizePathnameForWindows(netlifyFunctionsOutputUrl), name),
        });
        const { handler } = await import(
          new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl)
        );
        const response = await handler(
          {
            rawUrl: `${hostname}/blog/first-post/`,
            httpMethod: "GET",
          },
          {},
        );

        const { statusCode, body, headers } = response;
        const dom = new JSDOM(body);
        const headingOne = dom.window.document.querySelectorAll("body > h1");

        expect(statusCode).to.be.equal(200);
        expect(headers.get("content-type")).to.be.equal("text/html");

        expect(headingOne.length).to.be.equal(1);

        expect(headingOne[0].textContent).to.be.equal("Nested SSR First Post page should work!");
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
          `/artists/ /.netlify/functions/artists 200
/blog/first-post/ /.netlify/functions/blog-first-post 200
/blog/ /.netlify/functions/blog-index 200
/ /.netlify/functions/index 200
/post/ /.netlify/functions/post 200
/users/ /.netlify/functions/users 200
/api/fragment /.netlify/functions/api-fragment 200
/api/greeting /.netlify/functions/api-greeting 200
/api/nested/endpoint /.netlify/functions/api-nested-endpoint 200
/api/search /.netlify/functions/api-search 200
/api/submit-form-data /.netlify/functions/api-submit-form-data 200
/api/submit-json /.netlify/functions/api-submit-json 200
`,
        );
      });
    });
  });

  after(function () {
    runner.teardown([path.join(outputPath, "netlify"), ...getOutputTeardownFiles(outputPath)]);
  });
});
