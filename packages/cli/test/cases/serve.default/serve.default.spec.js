/*
 * Use Case
 * Run Greenwood serve command with no config.
 *
 * User Result
 * Should start the production server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   devServer: {
 *    proxy: {
 *      '/post': 'https://jsonplaceholder.typicode.com'
 *    }
 *   },
 *   port: 8181,
 *   activeContent: true // just here to test some basic content as data defaults
 * }
 *
 * User Workspace
 * src/
 *   index.html
 *   assets/
 *     data.json
 *     favicon.ico
 *     logo.png
 *     router.js.map
 *     song-sample.mp3
 *     source-sans-pro.woff
 *     splash-clip.mp4
 *     webcomponents.svg
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Serve Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8181";
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "serve");
      });
    });

    describe("<script> tag setup for active content", function () {
      let dom;

      before(async function () {
        const response = await fetch(`${hostname}`);
        dom = new JSDOM(await response.text());
      });

      it("should have a <script> tag that confirms content as data is set", function () {
        const stateScripts = dom.window.document.querySelectorAll("script#content-as-data-state");

        expect(stateScripts.length).to.equal(1);
        expect(stateScripts[0].textContent).to.contain(
          "globalThis.__CONTENT_AS_DATA_STATE__ = true;",
        );
      });

      it("should have a <script> tag that captures content as data related options", function () {
        const optionsScript = dom.window.document.querySelectorAll("script#data-client-options");

        expect(optionsScript.length).to.equal(1);
        expect(optionsScript[0].textContent).to.contain("PORT:1984");
        expect(optionsScript[0].textContent).to.contain('PRERENDER:"false"');
      });
    });

    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    describe("Serve command with dev proxy", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/posts?id=7`);
        data = await response.json();
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("application/json; charset=utf-8");
      });

      it("should return the correct response body", function () {
        expect(data).to.have.lengthOf(1);
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1059
    describe("Serve command with dev proxy with an /api prefix", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/api/posts?id=7`);
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

      it("should return the correct response body", function (done) {
        expect(JSON.stringify(data)).to.equal("{}");
        done();
      });
    });

    describe("Serve command with image (png) specific behavior", function () {
      const ext = "png";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/logo.${ext}`);
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

    describe("Serve command with image (ico) specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/favicon.ico`);
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

    describe("Serve command with SVG specific behavior", function () {
      const ext = "svg";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/webcomponents.${ext}`);
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

    describe("Serve command with font specific (.woff) behavior", function () {
      const ext = "woff";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/source-sans-pro.woff?v=1`);
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

    describe("Serve command with generic video container format (.mp4) behavior", function () {
      const ext = "mp4";
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/splash-clip.mp4`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal(`video/${ext}`);
        done();
      });

      it("should return the correct content length", function (done) {
        expect(response.headers.get("content-length")).to.equal("2498461");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain(ext);
        done();
      });
    });

    describe("Serve command with audio format (.mp3) behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/song-sample.mp3`);
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

    describe("Serve command with JSON specific behavior", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/assets/data.json`);
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

    describe("Serve command with source map specific behavior", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/assets/router.js.map`);
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
        expect(body).to.contain('"sources":["../packages/cli/src/lib/router.js"]');
        done();
      });
    });

    describe("Serve command with 404 not found behavior for a static asset", function () {
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}/foo.png`);
        body = await response.text();
      });

      it("should return a Not Found body", function (done) {
        expect(body).to.equal("Not Found");
        done();
      });

      it("should return a 404 status", function (done) {
        expect(response.status).to.equal(404);
        done();
      });

      it("should return a Content-Type of text/plain", function (done) {
        expect(response.headers.get("Content-Type")).to.equal("text/plain");
        done();
      });
    });

    describe("Serve command with 404 not found behavior for a non existent page", function () {
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}/foo`);
        body = await response.text();
      });

      it("should return a Not Found body", function (done) {
        expect(body).to.equal("Not Found");
        done();
      });

      it("should return a 404 status", function (done) {
        expect(response.status).to.equal(404);
        done();
      });

      it("should return a Content-Type of text/plain", function (done) {
        expect(response.headers.get("Content-Type")).to.equal("text/plain");
        done();
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});
