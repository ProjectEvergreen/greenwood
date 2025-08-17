/*
 * Use Case
 * Run Greenwood develop command with devServer config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   proxy: {
 *     '/post': 'https://jsonplaceholder.typicode.com'
 *   }
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     data.json
 *     favicon.ico
 *     fox.avif
 *     logo.png
 *     river-valley.webp
 *     song-sample.mp3
 *     source-sans-pro.woff
 *     splash-clip.mp4
 *     webcomponents.svg
 *   components/
 *     card.js
 *     header.js
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       fragment.js
 *       greeting.js
 *       missing.js
 *       nothing.js
 *       submit-form-data.js
 *       submit-json.js
 *     index.html
 *     404.html
 *   styles/
 *     main.css
 * package.json
 */
import chai from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner(true);
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, "develop", { async: true });
      });
    });

    runSmokeTest(["serve"], LABEL);

    describe("Develop command specific HTML behaviors", function () {
      let response = {};
      let dom;
      let expectedImportMap;

      before(async function () {
        response = await fetch(`http://127.0.0.1:${port}`);
        const data = await response.text();
        dom = new JSDOM(data);
        expectedImportMap = JSON.parse(
          fs.readFileSync(new URL("./import-map.snapshot.json", import.meta.url), "utf-8"),
        );
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should return an import map shim <script> in the <head> of the document", function (done) {
        const importMapTags = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        );
        const importMapTag = importMapTags[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;
        const expectedEntriesCount = Object.keys(expectedImportMap).length;
        const actualEntriesCount = Object.keys(importMap).length;

        expect(importMapTags.length).to.equal(1);
        expect(actualEntriesCount).to.equal(expectedEntriesCount);

        Object.keys(expectedImportMap).forEach((key) => {
          expect(expectedImportMap[key].startsWith("/~/")).to.equal(true);

          // truncate full location to avoid differences between local dev and CI workspace paths
          // e.g. passes on my machine
          const actualSubPath = importMap[key].slice(importMap[key].indexOf("/node_modules/"));
          const expectedSubPath = expectedImportMap[key].slice(
            expectedImportMap[key].indexOf("/node_modules/"),
          );

          expect(actualSubPath).to.equal(expectedSubPath);
        });

        done();
      });

      it("should add a <script> tag for livereload", function (done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head > script[src]"));
        const livereloadScript = scriptTags.filter((tag) => {
          return tag.getAttribute("src").indexOf("livereload.js") >= 0;
        });

        expect(livereloadScript.length).to.equal(1);

        done();
      });

      it("should add a <script> tag for tracking basePath configuration", function (done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head > script"));
        const basePathScript = scriptTags.filter((tag) => {
          return tag.getAttribute("data-gwd") === "base-path";
        });

        expect(basePathScript.length).to.equal(1);
        expect(basePathScript[0].textContent).to.contain("globalThis.__GWD_BASE_PATH__ = ''");
        done();
      });
    });

    describe("Develop command specific 404 Not Found page HTML behaviors", function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`http://127.0.0.1:${port}/404/`);
        const data = await response.text();
        dom = new JSDOM(data);
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should the correct default <title> tag in the <head>", function (done) {
        const title = dom.window.document.querySelectorAll("head > title")[0];

        expect(title.textContent).to.equal("Page Not Found");

        done();
      });

      it("should the correct default <h1> tag in the <body>", function (done) {
        const heading = dom.window.document.querySelectorAll("body > h1")[0];

        expect(heading.textContent).to.equal("Sorry, unfortunately the page could not be found.");

        done();
      });
    });

    describe("Develop command specific JavaScript behaviors for user authored custom element", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/components/header.js`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("class HeaderComponent extends HTMLElement");
        done();
      });
    });

    describe("Develop command specific CSS behaviors", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/styles/main.css`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/css");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("*{color:blue}");
        done();
      });
    });

    describe("Develop command with image (png) specific behavior", function () {
      const ext = "png";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/logo.${ext}`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal(`image/${ext}`);
        done();
      });

      it("should return binary data", function (done) {
        expect(body).to.contain("PNG");
        done();
      });
    });

    describe("Develop command with image (ico) specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/favicon.ico`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("image/x-icon");
        done();
      });

      it("should return binary data", function (done) {
        expect(body).to.contain("\u0000");
        done();
      });
    });

    describe("Develop command with image (webp) specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/river-valley.webp`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("image/webp");
        done();
      });

      it("should return binary data", function (done) {
        expect(body).to.contain("\u0000");
        done();
      });
    });

    describe("Develop command with image (avif) specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/fox.avif`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("image/avif");
        done();
      });

      it("should return binary data", function (done) {
        expect(body).to.contain("\u0000");
        done();
      });
    });

    describe("Develop command with image (svg) specific behavior", function () {
      const ext = "svg";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/webcomponents.${ext}`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal(`image/${ext}+xml`);
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body.indexOf("<svg")).to.equal(0);
        done();
      });
    });

    describe("Develop command with font specific (.woff) behavior", function () {
      const ext = "woff";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/source-sans-pro.${ext}?v=1`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal(`font/${ext}`);
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("wOFF");
        done();
      });
    });

    describe("Develop command with generic video container format (.mp4) behavior", function () {
      const ext = "mp4";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/splash-clip.mp4`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type header", function (done) {
        expect(response.headers.get("content-type")).to.equal(`video/${ext}`);
        done();
      });

      it("should return the correct content length header", function (done) {
        expect(response.headers.get("content-length")).to.equal("2498461");
        done();
      });

      it("should return the correct etag header", function (done) {
        expect(response.headers.get("etag")).to.equal("2130309740");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain(ext);
        done();
      });
    });

    describe("Develop command with generic video container format (.mp4) behavior that should return an etag hit", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/splash-clip.mp4`, {
          headers: new Headers({ "if-none-match": "2130309740" }),
        });
        body = await response.clone().text();
      });

      it("should return a 304 status", function (done) {
        expect(response.status).to.equal(304);
        done();
      });

      it("should return an empty body", function (done) {
        expect(body).to.contain("");
        done();
      });

      it("should return the correct cache-control header", function (done) {
        expect(response.headers.get("cache-control")).to.equal("no-cache");
        done();
      });
    });

    describe("Develop command with audio format (.mp3) behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/song-sample.mp3`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("audio/mpeg");
        done();
      });

      it("should return the correct content length", function (done) {
        expect(response.headers.get("content-length")).to.equal("5425061");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("ID3");
        done();
      });
    });

    describe("Develop command with JSON specific behavior", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}:${port}/assets/data.json`);
        data = await response.clone().json();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("application/json");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(data.name).to.equal("Marvin");
        done();
      });
    });

    describe("Develop command with source map specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/node_modules/lit-html/lit-html.js.map`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("application/json");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain('"sources":["src/lit-html.ts"]');
        done();
      });
    });

    describe("Develop command specific node modules resolution behavior for JS with query string", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/node_modules/lit-html/lit-html.js?type=xyz`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("Copyright 2017 Google LLC");
        done();
      });
    });

    describe("Develop command specific node modules resolution behavior for CSS with query string", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(
          `http://127.0.0.1:${port}/node_modules/simpledotcss/simple.css?xyz=123`,
        );
        body = await response.clone().text();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/css");
        done();
      });

      it("should correctly return CSS from the developers local files", function (done) {
        expect(body).to.contain(":root{--sans-font:-apple-system");
        done();
      });
    });

    // if things work correctly, this workspace file should never resolve to the equivalent node_modules file
    // https://github.com/ProjectEvergreen/greenwood/pull/687
    describe("Develop command specific workspace resolution when local file matches a file also in node_modules", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/lit-html.js`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body.replace(/\n/g, "")).to.equal('console.debug("its just a prank bro!");');
        done();
      });
    });

    // need some better 404 handling here (promise reject handling for assets and routes)
    describe("Develop command with default 404 behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/abc.js`);
        body = await response.clone().text();
      });

      it("should return a 404 status", function (done) {
        expect(response.status).to.equal(404);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/plain; charset=utf-8");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("");
        done();
      });

      it("should return the correct status message body", function (done) {
        expect(response.statusText).to.contain("Not Found");
        done();
      });
    });

    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    describe("Develop command with dev proxy", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}:${port}/posts?id=7`);
        data = await response.clone().json();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("application/json; charset=utf-8");
        done();
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/1159
      it("should not return a content-encoding header", function (done) {
        expect(response.headers["content-encoding"]).to.equal(undefined);
        done();
      });

      it("should return the correct response body", function (done) {
        expect(data).to.have.lengthOf(1);
        done();
      });
    });

    describe("Develop command with API specific behaviors", function () {
      const name = "Greenwood";
      let response = {};
      let data = {};

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/greeting?name=${name}`);
        data = await response.json();
      });

      it("should return a 200 status", function (done) {
        expect(response.ok).to.equal(true);
        expect(response.status).to.equal(200);
        done();
      });

      it("should return a default status message", function (done) {
        // OK appears to be a Koa default when statusText is an empty string
        expect(response.statusText).to.equal("OK");
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("application/json");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(data.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });

    describe('Develop command with API specific behaviors for an HTML ("fragment") API', function () {
      const name = "Greenwood";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/fragment?name=${name}`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return a custom status message", function (done) {
        expect(response.statusText).to.equal("SUCCESS!!!");
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain(`<h1>Hello ${name}!!!</h1>`);
        done();
      });
    });

    describe("Develop command with API specific behaviors with a custom response", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/missing`);
        body = await response.clone().text();
      });

      it("should return a 404 status", function (done) {
        expect(response.status).to.equal(404);
        done();
      });

      it("should return a body of not found", function (done) {
        expect(body).to.equal("Not Found");
        done();
      });
    });

    describe("Develop command with API specific behaviors with a minimal response", function () {
      let response = {};

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/nothing`);
      });

      it("should return a custom status code", function (done) {
        expect(response.status).to.equal(204);
        done();
      });
    });

    describe("Develop command with POST API specific behaviors for JSON", function () {
      const param = "Greenwood";
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/submit-json`, {
          method: "POST",
          body: JSON.stringify({ name: param }),
        });
        data = await response.json();
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the expected response message", function () {
        expect(data.message).to.equal(`Thank you ${param} for your submission!`);
      });

      it("should return the expected content type header", function () {
        expect(response.headers.get("content-type")).to.equal("application/json");
      });

      it("should return the secret header in the response", function () {
        expect(response.headers.get("x-secret")).to.equal("1234");
      });
    });

    describe("Develop command with POST API specific behaviors for FormData", function () {
      const param = "Greenwood";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/submit-form-data`, {
          method: "POST",
          body: new URLSearchParams({ name: param }).toString(),
          headers: new Headers({
            "content-type": "application/x-www-form-urlencoded",
          }),
        });
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the expected content type header", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return the expected response message", function (done) {
        expect(body).to.equal(`Thank you ${param} for your submission!`);
        done();
      });
    });

    describe("Develop command nested API specific behaviors", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}/api/nested/endpoint`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the expected content type header", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return the expected response message", function (done) {
        expect(body).to.contain("I am a nested API route");
        done();
      });
    });
  });

  after(function () {
    runner.stopCommand();
    runner.teardown([path.join(outputPath, ".greenwood"), path.join(outputPath, "node_modules")]);
  });
});
