/*
 * Use Case
 * Run Greenwood serve command with no basePath configuration set (and staticRouter).
 *
 * User Result
 * Should start the production server and render a the Greenwood application.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * devServer: {
 *   basePath: '/my-path',
 *   staticRouter: true,
 *   devServer: {
 *     proxy: {
 *       "/posts": "https://jsonplaceholder.typicode.com",
 *     },
 *   },
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     logo.png
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       greeting.js
 *     blog/
 *       [slug].js
 *     404.html
 *     about.html
 *     index.html
 *     users.js
 *   styles/
 *     main.css
 * package.json
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles, HASH_REGEX } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Base Path Configuration";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const publicPath = path.join(outputPath, "public/");
  const hostname = "http://127.0.0.1:8080";
  const basePath = "/my-path";
  const jsHash = "eCbOYUm_";
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
      await runner.runCommand(cliPath, "build");

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "serve", {
            onStdOut: (message) => {
              if (message.includes("Started server at http://localhost:8080")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Serve command specific HTML behaviors", function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`${hostname}${basePath}/`, {
          headers: {
            accept: "text/html",
          },
        });

        dom = new JSDOM(await response.clone().text());
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should add a <script> tag for tracking basePath configuration", function (done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head > script"));
        const basePathScript = scriptTags.filter((tag) => {
          return tag.getAttribute("data-gwd") === "base-path";
        });

        expect(basePathScript.length).to.equal(1);
        expect(basePathScript[0].textContent).to.contain(
          `globalThis.__GWD_BASE_PATH__="${basePath}"`,
        );
        done();
      });

      it("should have the expected heading tag in the DOM", function (done) {
        const headings = Array.from(dom.window.document.querySelectorAll("body h1"));

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("Hello World");

        done();
      });

      it("should have the expected <app-card> tag in the DOM", function (done) {
        const cards = Array.from(dom.window.document.querySelectorAll("body app-card"));

        expect(cards.length).to.equal(1);

        done();
      });

      it("should have the correct script link preload tag path in the DOM", function (done) {
        const links = Array.from(dom.window.document.querySelectorAll("head > link")).filter(
          (link) => link.getAttribute("as") === "script",
        );

        // TODO for some reason there is an extra <link> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(links.length).to.equal(2);
        expect(links[1].getAttribute("href")).to.match(
          new RegExp(`${basePath}/card.${HASH_REGEX}.js`),
        );

        done();
      });

      it("should have the correct script tag path in the DOM for the card component", function (done) {
        const scripts = Array.from(dom.window.document.querySelectorAll("head script")).filter(
          (script) => script.getAttribute("type") === "module",
        );

        // TODO for some reason there is an extra <script> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(scripts.length).to.equal(2);
        expect(scripts[0].getAttribute("src")).to.match(
          new RegExp(`${basePath}/card\\.${HASH_REGEX}\\.js`),
        );

        done();
      });

      it("should have the correct style preload tag path in the DOM", function (done) {
        const links = Array.from(dom.window.document.querySelectorAll("head link")).filter(
          (link) => link.getAttribute("as") === "style",
        );

        expect(links.length).to.equal(1);
        expect(links[0].getAttribute("href")).to.match(
          new RegExp(`${basePath}/styles/main\\.${HASH_REGEX}\\.css`),
        );

        done();
      });

      it("should have the correct link tag for the stylesheet in the DOM", function (done) {
        const styles = Array.from(dom.window.document.querySelectorAll("head > link")).filter(
          (link) => link.getAttribute("rel") === "stylesheet",
        );

        expect(styles.length).to.equal(1);
        expect(styles[0].getAttribute("href")).to.match(
          new RegExp(`${basePath}/styles/main\\.${HASH_REGEX}\\.css`),
        );

        done();
      });
    });

    describe("Serve command specific JavaScript behaviors for user authored custom element", function () {
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}${basePath}/card.${jsHash}.js`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("text/javascript");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("class t extends HTMLElement");
        done();
      });
    });

    describe("Serve command specific CSS behaviors", function () {
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}${basePath}/styles/main.Bs32TLjt.css`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("text/css");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.match(
          new RegExp(
            `\\*\\{color:blue;background-image:url\\('/my-path/images/webcomponents\\.${HASH_REGEX}\\.jpg'\\);\\}`,
          ),
        );
        done();
      });
    });

    describe("Serve command with image (png) specific behavior", function () {
      const ext = "png";
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}${basePath}/assets/logo.${ext}`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain(`image/${ext}`);
        done();
      });

      it("should return binary data", function (done) {
        expect(body).to.contain("PNG");
        done();
      });
    });

    describe("Static content routes", function () {
      let dom;
      let aboutDom;
      let pages;
      let partials;
      let routerFiles;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(publicPath, "index.html"));
        aboutDom = await JSDOM.fromFile(path.resolve(publicPath, "about/index.html"));
        pages = await glob(`${publicPath}/*.html`);
        partials = await glob(`${publicPath}/_routes/**/*.html`);
        routerFiles = await glob(`${publicPath}/router.*.js`);
      });

      it("should have one <script> tag in the <head> for the router", function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script[type]");

        // TODO for some reason there is an extra <script> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(scriptTags.length).to.be.equal(2);
        expect(scriptTags[0].href).to.contain(/router.*.js/);
        expect(scriptTags[0].type).to.be.equal("module");
      });

      it("should have one router.js file in the output directory", function () {
        expect(routerFiles.length).to.be.equal(1);
      });

      it("should have one expected inline <script> tag in the <head> for router global variables", function () {
        const routerScriptTags = Array.from(
          dom.window.document.querySelectorAll("head > script"),
        ).filter((tag) => tag.getAttribute("data-gwd") === "static-router");

        expect(routerScriptTags.length).to.be.equal(1);
        expect(routerScriptTags[0].textContent.replace(/ /g, "").replace(/\n/g, "")).to.contain(
          `window.__greenwood=window.__greenwood||{};window.__greenwood.currentLayout="page"`,
        );
      });

      it("should have one <router-outlet> tag in the <body> for the content", function () {
        const routerOutlets = dom.window.document.querySelectorAll("body > router-outlet");

        expect(routerOutlets.length).to.be.equal(1);
      });

      it("should have expected <greenwood-route> tags in the <body> for each page", function () {
        const routeTags = dom.window.document.querySelectorAll("body > greenwood-route");

        expect(routeTags.length).to.be.equal(5);
      });

      it("should have the expected properties for each <greenwood-route> tag for the home page", function () {
        const homeRouteTag = Array.from(
          dom.window.document.querySelectorAll("body > greenwood-route"),
        ).filter((tag) => tag.dataset.route === `${basePath}/`);
        const dataset = homeRouteTag[0].dataset;

        expect(homeRouteTag.length).to.be.equal(1);
        expect(dataset.layout).to.be.equal("page");
        expect(dataset.key).to.be.equal(`${basePath}/_routes/index.html`);
      });

      it("should have the expected properties for each <greenwood-route> tag for the about page", function () {
        const aboutRouteTag = Array.from(
          dom.window.document.querySelectorAll("body > greenwood-route"),
        ).filter((tag) => tag.dataset.route === `${basePath}/about/`);
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.layout).to.be.equal("test");
        expect(dataset.key).to.be.equal(`${basePath}/_routes/about/index.html`);
      });

      // tests to make sure we filter out 404 page from _route partials
      it("should have the expected top level HTML files (index.html, 404.html) in the output", function () {
        expect(pages.length).to.equal(2);
      });

      it("should have the expected number of _route partials in the output directory for each page", function () {
        expect(partials.length).to.be.equal(5); // 3 partials comes from src/pages/blog/[slug].js
      });

      it("should have the expected partial output to match the contents of the home page in the <router-outlet> tag in the <body>", function () {
        const homePartial = fs.readFileSync(path.join(publicPath, "_routes/index.html"), "utf-8");
        const homeRouterOutlet = dom.window.document.querySelectorAll("body > router-outlet")[0];

        expect(homeRouterOutlet.innerHTML.replace(/\n/g, "").replace(/ /g, "")).to.contain(
          homePartial.replace(/\n/g, "").replace(/ /g, ""),
        );
      });

      it("should have the expected partial output to match the contents of the about page in the <router-outlet> tag in the <body>", function () {
        const aboutPartial = fs.readFileSync(
          path.join(publicPath, "_routes/about/index.html"),
          "utf-8",
        );
        const aboutRouterOutlet =
          aboutDom.window.document.querySelectorAll("body > router-outlet")[0];

        expect(aboutRouterOutlet.innerHTML).to.contain(aboutPartial);
      });
    });

    describe("Serve command with dev proxy", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}${basePath}/posts?id=7`);
        data = await response.clone().json();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("application/json");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(data).to.have.lengthOf(1);
        done();
      });
    });

    describe("Serve command with API specific behaviors", function () {
      const name = "Greenwood";
      let response = {};
      let data = {};

      before(async function () {
        response = await fetch(`${hostname}${basePath}/api/greeting?name=${name}`);

        data = await response.json();
      });

      it("should return a 200 status", function (done) {
        expect(response.ok).to.equal(true);
        expect(response.status).to.equal(200);
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

    describe("Prerender an HTML route response for users page exporting an HTMLElement as default export", function () {
      let usersPageDom;

      before(async function () {
        const response = await fetch(`${hostname}${basePath}/users/`);
        usersPageDom = new JSDOM(await response.text());
      });

      it("the response body should be valid HTML from JSDOM", function (done) {
        expect(usersPageDom).to.not.be.undefined;
        done();
      });

      it("should have the expected <h1> text in the <body>", function () {
        const heading = usersPageDom.window.document.querySelectorAll("body > h1");
        const userLength = parseInt(heading[0].querySelector("span").textContent, 10);

        expect(heading.length).to.be.equal(1);
        expect(heading[0].textContent).to.contain("List of Users:");
        expect(userLength).to.greaterThan(0);
      });

      it("should have the expected number of <section> tags in the <body>", function () {
        const cards = usersPageDom.window.document.querySelectorAll("body > section");

        expect(cards.length).to.be.greaterThan(0);
      });
    });

    describe("Partials from dynamic route with getStaticPaths", function () {
      let partials = [];
      let dom;

      before(async function () {
        const response = await fetch(`${hostname}${basePath}/`);

        dom = new JSDOM(await response.clone().text());
        partials = await Array.fromAsync(
          fs.promises.glob("**/*.html", { cwd: new URL("./public/_routes/blog", import.meta.url) }),
        );
      });

      it("should have three partials for static path blog posts", function () {
        expect(partials.length).to.equal(3);
      });

      it("should have the expected content for each partial", function () {
        const contents = partials.map((partial) =>
          fs.readFileSync(path.join(publicPath, `_routes/blog/${partial}`), "utf-8"),
        );
        let matched = 0;

        // have to loop since filesystems could come back in any order
        contents.forEach((content) => {
          const trimmed = content.trim().replace(/\n/g, "").replace(/ /, "");

          if (trimmed.indexOf("First") > 0) {
            expect(trimmed).to.equal("<h1>FirstPost</h1>");
            matched++;
          } else if (content.indexOf("Second") > 0) {
            expect(trimmed).to.equal("<h1>SecondPost</h1>");
            matched++;
          } else if (content.indexOf("Third") > 0) {
            expect(trimmed).to.equal("<h1>ThirdPost</h1>");
            matched++;
          }
        });

        expect(matched).to.equal(partials.length);
      });

      it("should have the expected partial output to match the contents of the getStaticPath routes home page in the <router-outlet> tag in the <body>", function () {
        const routeTags = dom.window.document.querySelectorAll("body > greenwood-route");
        const firstPostTag = Array.from(routeTags).find(
          (tag) => tag.getAttribute("data-route") === "/my-path/blog/first-post/",
        );
        const secondPostTag = Array.from(routeTags).find(
          (tag) => tag.getAttribute("data-route") === "/my-path/blog/second-post/",
        );
        const thirdPostTag = Array.from(routeTags).find(
          (tag) => tag.getAttribute("data-route") === "/my-path/blog/third-post/",
        );

        expect(firstPostTag).to.not.be.undefined;
        expect(firstPostTag.getAttribute("data-key")).to.equal(
          "/my-path/_routes/blog/first-post/index.html",
        );
        expect(firstPostTag.getAttribute("data-layout")).to.equal("page");

        expect(secondPostTag).to.not.be.undefined;
        expect(secondPostTag.getAttribute("data-key")).to.equal(
          "/my-path/_routes/blog/second-post/index.html",
        );
        expect(secondPostTag.getAttribute("data-layout")).to.equal("page");

        expect(thirdPostTag).to.not.be.undefined;
        expect(thirdPostTag.getAttribute("data-key")).to.equal(
          "/my-path/_routes/blog/third-post/index.html",
        );
        expect(thirdPostTag.getAttribute("data-layout")).to.equal("page");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
