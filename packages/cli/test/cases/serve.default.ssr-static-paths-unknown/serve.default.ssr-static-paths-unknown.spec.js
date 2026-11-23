/*
 * Use Case
 * Run Greenwood with SSR routes that use getStaticPaths and request dynamic route values that were not returned from getStaticPaths.
 * https://github.com/ProjectEvergreen/greenwood/issues/1737
 *
 * User Result
 * Should serve known static paths with a 200 and return a 404 (instead of a 500) for unknown dynamic route values.
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
 *     empty/
 *       [nothing].js
 *     [slug].js
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Dynamic Routing for Get Static Paths with unknown dynamic route values";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "serve",
            onStdOut: (message) => {
              if (message.includes(`Started server at ${hostname}`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("An SSR page with a dynamic route value returned from getStaticPaths", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/alpha/`);
        dom = new JSDOM(await response.clone().text());
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should have the expected output for the page in the h2 tag", function () {
        const headings = dom.window.document.querySelectorAll("body h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("alpha");
      });
    });

    for (const slug of ["costs-$&", "costs-$$", "costs-$`"]) {
      it(`should serve the static path ${slug} without expanding replacement tokens`, async function () {
        const response = await fetch(`${hostname}/${encodeURI(slug)}/`);
        const dom = new JSDOM(await response.text());

        expect(response.status).to.equal(200);
        expect(dom.window.document.querySelector("body h2").textContent).to.equal(slug);
      });
    }

    // https://github.com/ProjectEvergreen/greenwood/issues/1737
    describe("An SSR page with a dynamic route value NOT returned from getStaticPaths", function () {
      let response;

      before(async function () {
        response = await fetch(`${hostname}/nope/`);
      });

      it("should return a 404 status instead of a 500", function () {
        expect(response.status).to.equal(404);
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1737
    describe("An SSR page where getStaticPaths returns an empty array", function () {
      let response;

      before(async function () {
        response = await fetch(`${hostname}/empty/anything/`);
      });

      it("should return a 404 status instead of a 500", function () {
        expect(response.status).to.equal(404);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
