/*
 * Use Case
 * Run Greenwood server with an SSR route built using Lit SSR.
 *
 * User Result
 * Should generate a Greenwood build for hosting a server rendered application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginRendererLit()
 *   }]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     card.js
 *     footer.js
 *     greeting.js
 *   pages/
 *     api/
 *       search.js
 *     artists.js
 *     users.js (isolation = false)
 *   layouts/
 *     app.html
 */
import chai from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Serve Greenwood With: ", function () {
  const LABEL = "Custom Lit Renderer for SSR";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "serve", { async: true });
      });
    });

    let response = {};
    let artists = [];
    let data;
    let dom;
    let usersPageDom;
    let usersPageHtml;
    let artistsPageGraphData;

    before(async function () {
      const graph = JSON.parse(
        await fs.promises.readFile(path.join(outputPath, "public/graph.json"), "utf-8"),
      );
      artists = JSON.parse(
        await fs.promises.readFile(new URL("./artists.json", import.meta.url), "utf-8"),
      );

      artistsPageGraphData = graph.filter((page) => page.route === "/artists/")[0];

      response = await fetch(`${hostname}/artists/`);
      data = await response.text();
      dom = new JSDOM(data);

      response = await fetch(`${hostname}/users/`);
      usersPageHtml = await response.text();
      usersPageDom = new JSDOM(usersPageHtml);
    });

    describe("Serve command with HTML route response using getBody, getLayout and getFrontmatter for the artists page", function () {
      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/html");
      });

      it("should return a response body", function () {
        expect(data).to.not.be.undefined;
      });

      it("the response body should be valid HTML from JSDOM", function () {
        expect(dom).to.not.be.undefined;
      });

      it("should have one <style> tag in the <head>", function () {
        const styles = dom.window.document.querySelectorAll("head > style");

        expect(styles.length).to.equal(1);
      });

      it("should have the expected number of <tr> tags of content", function () {
        const rows = dom.window.document.querySelectorAll("body > table tr");

        // one heading and 11 for content
        expect(rows.length).to.equal(12);
      });

      it("should have the expected number of <simple-greeting> components with expected text content", function () {
        const greetings = dom.window.document.querySelectorAll("body > table tr simple-greeting");

        expect(greetings.length).to.equal(11);

        greetings.forEach((greeting, index) => {
          // it should not be the default of Somebody, since real data should be in there
          expect(greeting.innerHTML).to.contain(`Hello, <!--lit-part-->${artists[index].name}`);
        });
      });

      it("should have the expected <title> content in the <head>", function () {
        const title = dom.window.document.querySelectorAll("head > title");

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal("My App - /artists/");
      });

      it("should have custom metadata in the <head>", function () {
        const metaDescription = Array.from(
          dom.window.document.querySelectorAll("head > meta"),
        ).filter((tag) => tag.getAttribute("name") === "description");

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute("content")).to.equal(
          "/artists/ (this was generated server side!!!)",
        );
      });

      it("should be a part of graph.json", function () {
        expect(artistsPageGraphData).to.not.be.undefined;
      });

      it("should have the expected menu and index values in the graph", function () {
        expect(artistsPageGraphData.data.collection).to.equal("navigation");
        expect(artistsPageGraphData.data.order).to.equal(7);
      });

      it("should have expected custom data values in its graph data", function () {
        expect(artistsPageGraphData.data.author).to.equal("Project Evergreen");
        expect(artistsPageGraphData.data.date).to.equal("01-01-2021");
      });

      it("should not have the expected lit hydration script in the <head>", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head script")).filter(
          (script) => script.getAttribute("src")?.indexOf("lit-element-hydrate-support") >= 0,
        );

        expect(scripts.length).to.equal(0);
      });
    });

    describe("Serve command with HTML route response using LitElement as a getPage export with an <app-footer> component for the users page", function () {
      it("the response body should be valid HTML from JSDOM", function (done) {
        expect(usersPageDom).to.not.be.undefined;
        done();
      });

      it("should have the expected <h1> text in the <body>", function () {
        expect(usersPageHtml).to.contain("Users Page");
      });

      it("should have the expected users length text in the <body>", function () {
        expect(usersPageHtml).to.contain(
          `<div id="users"><!--lit-part-->${artists.length}<!--/lit-part--></div>`,
        );
      });

      it("should have the expected <app-footer> content in the <body>", function () {
        expect(usersPageHtml).to.contain('<footer class="footer">');
      });

      it("should have the expected lit hydration script in the <head>", function () {
        const scripts = Array.from(
          usersPageDom.window.document.querySelectorAll("head script"),
        ).filter(
          (script) => script.getAttribute("src")?.indexOf("lit-element-hydrate-support") >= 0,
        );

        expect(scripts.length).to.equal(1);
      });
    });

    describe("Serve command with API route server rendering LitElement <app-card> components as an HTML response", function () {
      const term = "Analog";
      let resp;
      let html;
      let dom;

      before(async function () {
        resp = await fetch(`${hostname}/api/search`, {
          method: "POST",
          body: new URLSearchParams({ term }).toString(),
          headers: new Headers({
            "content-type": "application/x-www-form-urlencoded",
          }),
        });
        html = await resp.text();
        dom = new JSDOM(html);
      });

      it("should have a response status of 200", function (done) {
        expect(resp.status).to.equal(200);

        done();
      });

      it("should have a Content-Type header of text/html", function (done) {
        const type = response.headers.get("Content-Type");

        expect(type).to.equal("text/html");

        done();
      });

      it("should have the expected number of <app-card> components for a single search result", function (done) {
        const cards = dom.window.document.querySelectorAll(
          'app-card template[shadowrootmode="open"]',
        );
        const cardDom = new JSDOM(cards[0].innerHTML);

        expect(cards.length).to.equal(1);
        // TODO this should be real data (see issue with static in card.js)
        expect(cardDom.window.document.querySelectorAll("h3")[0].textContent).to.equal("Foo");
        expect(cardDom.window.document.querySelectorAll("img")[0].getAttribute("src")).to.equal(
          "bar.png",
        );

        done();
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});
