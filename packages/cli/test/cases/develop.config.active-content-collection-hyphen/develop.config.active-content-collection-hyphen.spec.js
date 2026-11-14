/*
 * Use Case
 * Run Greenwood develop command with active content and a collection whose name
 * contains a hyphen (e.g. "my-posts"), queried via the /___graph.json content key API.
 *
 * User Result
 * Should start the dev server and return the pages belonging to a hyphenated collection
 * when requested with X-CONTENT-KEY: collection-my-posts (regression for content keys
 * being split on every hyphen).
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   activeContent: true,
 *   devServer: {
 *     port: 1988
 *   }
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     my-blog/
 *       first.html      (collection: my-posts)
 *       second.html     (collection: [my-posts, nav])
 *     about.html        (collection: nav)
 *     index.html        (collection: nav)
 */

// https://github.com/ProjectEvergreen/greenwood/issues/1715
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Active Content with a hyphenated collection name";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      hostname = await startServer(runner, cliPath, "develop");
      this.context.hostname = hostname;
    });

    describe("Content Request Types", () => {
      describe("Hyphenated Collection Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/___graph.json`, {
            headers: {
              "x-content-key": "collection-my-posts",
            },
          });
        });

        it("should return the pages that belong to the hyphenated collection", async () => {
          const data = await response.json();

          expect(data.length).to.equal(2);
        });
      });

      describe("Hyphen-free Collection Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/___graph.json`, {
            headers: {
              "x-content-key": "collection-nav",
            },
          });
        });

        it("should still return the pages that belong to a hyphen-free collection", async () => {
          const data = await response.json();

          expect(data.length).to.equal(3);
        });
      });

      describe("Route Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/___graph.json`, {
            headers: {
              "x-content-key": "route-/my-blog",
            },
          });
        });

        it("should still return the pages under a hyphenated route", async () => {
          const data = await response.json();

          expect(data.length).to.equal(2);
        });
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
