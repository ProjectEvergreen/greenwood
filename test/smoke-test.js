/*
 * This module can be used to run a suite of smoke tests for any CLI based test case to
 * verify default behavior and output.  Can be run a-la carte to help reduce duplication and
 * boilerplate when writing tests.
 *
 * There are a number of examples in the CLI package you can use as a reference.
 *
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import http from "node:http";
import { JSDOM } from "jsdom";
import path from "node:path";
import { tagsMatch } from "./utils.js";

const expect = chai.expect;

function commonIndexSpecs(dom, html, label) {
  describe(`Running Common Index Smoke Tests for ${label}`, function () {
    describe("document <html>", function () {
      it("should have an <doctype> tag with the html attribute", function () {
        const trimmedHtml = html.replace(/<!--*.*-->/, "");

        expect(trimmedHtml).to.satisfy(function () {
          return (
            trimmedHtml.indexOf("<!doctype html>") === 0 ||
            trimmedHtml.indexOf("<!DOCTYPE html>") === 0
          );
        });
      });

      it("should have matching opening and closing <html> tags", function () {
        expect(tagsMatch("html", html, 1)).to.be.equal(true);
      });
    });

    describe("document <head>", function () {
      it("should have matching opening and closing <head> tags in the <head>", function () {
        // add an explicit > here to avoid conflicting with <header>
        // which is used in a lot of test case scaffolding
        expect(tagsMatch("head>", html, 1)).to.be.equal(true);
      });

      it("should have matching opening and closing <script> tags in the <head>", function () {
        expect(tagsMatch("script", html)).to.be.equal(true);
      });

      it("should not have nested <script> tags in the <head>", function () {
        const scripts = dom.window.document.querySelectorAll("head script > script");

        expect(scripts.length).to.be.equal(0);
      });

      it("should have matching opening and closing <link> tags in the <head>", function () {
        const html = dom.window.document.querySelector("html").textContent;

        expect(tagsMatch("link", html)).to.be.equal(true);
      });

      it("should not have nested <link> tags in the <head>", function () {
        const link = dom.window.document.querySelectorAll("head link > link");

        expect(link.length).to.be.equal(0);
      });

      it("should have matching opening and closing <style> tags in the <head>", function () {
        expect(tagsMatch("style", html)).to.be.equal(true);
      });

      it("should not have nested <style> tags in the <head>", function () {
        const style = dom.window.document.querySelectorAll("head style > style");

        expect(style.length).to.be.equal(0);
      });

      it("should not have any optimization markers left in the HTML", function () {
        expect(html.match(/data-gwd-opt=".*[a-z]"/)).to.be.equal(null);
      });

      it("should not have any module based <script> tags that come _before_ any importmaps in the <head>", function () {
        const scripts = Array.from(
          dom.window.document.querySelectorAll('script[type="module"] + script[type*="importmap"]'),
        );

        expect(scripts.length).to.equal(0);
      });
    });

    describe("document <body>", function () {
      it("should have matching opening and closing <body> tags", function () {
        expect(tagsMatch("body", html, 1)).to.be.equal(true);
      });

      it("should have no <script> tags in the <body>", function () {
        const bodyScripts = dom.window.document.querySelectorAll("body script");

        expect(bodyScripts.length).to.be.equal(0);
      });

      it("should have no <link> tags in the <body>", function () {
        const bodyLinks = dom.window.document.querySelectorAll("body link");

        expect(bodyLinks.length).to.be.equal(0);
      });

      it("should have no <style> tags in the <body>", function () {
        const bodyStyles = dom.window.document.querySelectorAll("body style");

        expect(bodyStyles.length).to.be.equal(0);
      });

      it("should have no <meta> tags in the <body>", function () {
        const bodyMetas = dom.window.document.querySelectorAll("body meta");

        expect(bodyMetas.length).to.be.equal(0);
      });

      it("should have no <content-outlet> tags in the <body>", function () {
        const contentOutlet = dom.window.document.querySelectorAll("body content-outlet");

        expect(contentOutlet.length).to.be.equal(0);
      });

      it("should have no <page-outlet> tags in the <body>", function () {
        const pageOutlet = dom.window.document.querySelectorAll("body page-outlet");

        expect(pageOutlet.length).to.be.equal(0);
      });

      it("should not have any sourcemap inlining for Rollup HTML entry points", function () {
        expect(html).not.to.contain(/\/\/# sourceMappingURL=(.*)\.html\.map/);
      });
    });
  });
}

function publicDirectory(label) {
  describe(`Running Smoke Tests: ${label}`, function () {
    describe("Public Directory Generated Output", function () {
      it("should create a public directory", function () {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it("should output one graph.json file", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "graph.json")),
        ).to.have.lengthOf(1);
      });

      it("should not output any map files for HTML pages", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "**/**/*.html.map")),
        ).to.have.lengthOf(0);
      });
    });
  });
}

function defaultIndex(label) {
  describe(`Running Smoke Tests: ${label}`, function () {
    describe("Index (Home) page", function () {
      let dom;
      let html;

      before(async function () {
        const htmlPath = path.resolve(this.context.publicDir, "index.html");

        dom = await JSDOM.fromFile(htmlPath);
        html = await fs.promises.readFile(htmlPath, "utf-8");
      });

      it("should do all the common checks for an HTML page", function (done) {
        commonIndexSpecs(dom, html, label);
        done();
      });
    });
  });
}

function serve(label) {
  describe(`Running Smoke Tests: ${label}`, function () {
    describe("Serving Index (Home) page", function () {
      let dom;
      let response = {
        body: "",
        code: 0,
      };

      before(async function () {
        return new Promise((resolve, reject) => {
          http
            .get(this.context.hostname, (res) => {
              res.setEncoding("utf8");
              response.status = res.statusCode;
              response.headers = res.headers;

              res.on("data", (chunk) => (response.body += chunk));
              res.on("end", () => {
                dom = new JSDOM(response.body);
                resolve(response);
              });
            })
            .on("error", reject);
        });
      });

      it("should start the server and return 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers["content-type"]).to.contain("text/html");
        done();
      });

      it("should do all the common checks for an HTML page", function (done) {
        commonIndexSpecs(dom, response.body, label);
        done();
      });
    });
  });
}

async function runSmokeTest(testCases, label) {
  testCases.forEach((testCase) => {
    switch (testCase) {
      case "index":
        defaultIndex(label);
        break;
      case "public":
        publicDirectory(label);
        break;
      case "serve":
        serve(label);
        break;
      default:
        console.warn(`unknown case ${testCase}`);
        break;
    }
  });
}

export { runSmokeTest };
