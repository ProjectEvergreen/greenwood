/*
 * Use Case
 * Run Greenwood develop with prerendering, Content-as-Data, a base path, import-map shims, and a resource interceptor.
 *
 * User Result
 * Should prerender HTML pages and SSR layouts, preserve request-time SSR content,
 * honor page-level overrides, and pick up component edits without restarting.
 * Should recover from rendering errors and use a fallback port when the configured port is occupied.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   prerender: true,
 *   activeContent: true,
 *   basePath: '/demo',
 *   devServer: { port: 21984 },
 *   polyfills: { importMaps: true }
 * }
 * A custom resource interceptor also adds an app-badge to the index page before prerendering.
 *
 * User Workspace
 * src/
 *   components/
 *     counter.js
 *     header.js
 *     message.js
 *   layouts/
 *     app.html
 *   pages/
 *     api/
 *       status.js
 *     event/
 *       [slug].js
 *     disabled.html
 *     index.html
 *     ssr.js
 */
import { expect } from "chai";
import fs from "node:fs";
import net from "node:net";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Prerender Configuration";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const messagePath = new URL("./src/components/message.js", import.meta.url);
  const headerPath = new URL("./src/components/header.js", import.meta.url);
  const preferredPort = 21984;
  let runner;
  let blocker;
  let hostname;
  let originalMessage;
  let originalHeader;

  before(function () {
    runner = new Runner();
    blocker = net.createServer();
    originalMessage = fs.readFileSync(messagePath, "utf-8");
    originalHeader = fs.readFileSync(headerPath, "utf-8");
  });

  describe(LABEL, function () {
    before(async function () {
      await new Promise((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(preferredPort, resolve);
      });
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        let output = "";
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              output += message;
              const ready = output.match(
                /Started local development server at (http:\/\/localhost:\d+\/demo)/,
              );
              if (ready) {
                hostname = ready[1];
                resolve();
              }
            },
          })
          .then(
            () => reject(new Error(`Develop command exited before server readiness: ${output}`)),
            reject,
          );
      });
    });

    describe("Prerendered index page", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should use the fallback port and return HTML", function () {
        expect(new URL(hostname).port).not.to.equal("21984");
        expect(response.headers.get("content-type")).to.contain("text/html");
      });

      it("should prerender the layout and Content-as-Data with the base path", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.contain(
          "Original header",
        );
        const links = [...dom.window.document.querySelectorAll("app-header nav a")];
        expect(links).to.have.length(4);
        expect(links.every((link) => link.getAttribute("href").startsWith("/demo/"))).to.equal(
          true,
        );
      });

      it("should execute and remove static scripts regardless of unrelated data-gwd attributes", function () {
        expect(dom.window.document.querySelector('script[src="/components/header.js"]')).to.equal(
          null,
        );
        expect(dom.window.document.querySelector('script[data-gwd-opt="static"]')).to.equal(null);
        expect(dom.window.document.querySelector("app-badge").textContent).to.equal("Inline badge");
      });

      it("should prerender content added by resource interceptors", function () {
        expect(
          dom.window.document.querySelector("app-badge.from-interceptor").textContent,
        ).to.equal("Inline badge");
      });

      it("should retain client scripts alongside declarative shadow DOM", function () {
        expect(
          dom.window.document.querySelector('script[src="/components/counter.js"]'),
        ).not.to.equal(null);
        const template = dom.window.document.querySelector(
          'app-counter template[shadowrootmode="open"]',
        );
        expect(template.content.querySelector("button").textContent).to.equal("Count: 0");
      });

      it("should retain live reload, import-map shims, framework state, and structured data", function () {
        expect(
          dom.window.document.querySelectorAll('script[src*="/livereload.js"]'),
        ).to.have.length(1);
        expect(
          dom.window.document.querySelectorAll(
            'script[src="/node_modules/es-module-shims/dist/es-module-shims.js"]',
          ),
        ).to.have.length(1);
        expect(
          dom.window.document.querySelectorAll('script[type="importmap-shim"]'),
        ).to.have.length(1);
        expect(
          dom.window.document.querySelector('script[data-gwd="base-path"]').textContent,
        ).to.contain("/demo");
        expect(
          dom.window.document.querySelector("script#data-client-options").textContent,
        ).to.contain(new URL(hostname).port);
        expect(
          JSON.parse(
            dom.window.document.querySelector('script[type="application/ld+json"]').textContent,
          ),
        ).to.deep.equal({ name: "Prerender test" });
      });
    });

    describe("Page-level prerender opt-out", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/disabled/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should leave components and scripts for the browser", function () {
        expect(dom.window.document.querySelector("app-header").innerHTML).to.equal("");
        expect(
          dom.window.document.querySelector('script[src="/components/header.js"]'),
        ).not.to.equal(null);
        expect(dom.window.document.querySelector("app-counter template")).to.equal(null);
      });
    });

    describe("First SSR request", function () {
      const value = "first";
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/ssr/?value=${encodeURIComponent(value)}`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should preserve request-time content while prerendering the layout", function () {
        expect(dom.window.document.querySelector("h1").textContent).to.equal(value);
        expect(dom.window.document.querySelectorAll("app-header header")).to.have.length(1);
        expect(
          dom.window.document.querySelector("app-header[data-ssr-content]").innerHTML,
        ).to.equal("Preserved SSR content");
      });
    });

    describe("Second SSR request", function () {
      const value = "second";
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/ssr/?value=${encodeURIComponent(value)}`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should preserve request-time content while prerendering the layout", function () {
        expect(dom.window.document.querySelector("h1").textContent).to.equal(value);
        expect(dom.window.document.querySelectorAll("app-header header")).to.have.length(1);
        expect(
          dom.window.document.querySelector("app-header[data-ssr-content]").innerHTML,
        ).to.equal("Preserved SSR content");
      });
    });

    describe("SSR request containing literal replacement patterns", function () {
      const value = "costs $& and $` and $1";
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/ssr/?value=${encodeURIComponent(value)}`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should preserve request-time content while prerendering the layout", function () {
        expect(dom.window.document.querySelector("h1").textContent).to.equal(value);
        expect(dom.window.document.querySelectorAll("app-header header")).to.have.length(1);
        expect(
          dom.window.document.querySelector("app-header[data-ssr-content]").innerHTML,
        ).to.equal("Preserved SSR content");
      });
    });

    describe("Dynamic SSR route", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/event/hello%20world/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should protect dynamic SSR content while prerendering its layout", function () {
        expect(dom.window.document.querySelector("h1").textContent).to.equal("hello world");
        expect(dom.window.document.querySelectorAll("app-header header")).to.have.length(1);
        expect(
          dom.window.document.querySelector("app-header[data-ssr-content]").innerHTML,
        ).to.equal("Preserved dynamic SSR content");
      });
    });

    describe("Overlapping page requests", function () {
      let responses;
      let doms;

      before(async function () {
        responses = await Promise.all([
          fetch(`${hostname}/`),
          fetch(`${hostname}/`),
          fetch(`${hostname}/`),
        ]);
        const bodies = await Promise.all(responses.map((response) => response.text()));
        doms = bodies.map((body) => new JSDOM(body));
      });

      it("should prerender each request independently", function () {
        responses.forEach((response) => expect(response.status).to.equal(200));
        doms.forEach((dom) =>
          expect(dom.window.document.querySelectorAll("app-header header")).to.have.length(1),
        );
      });
    });

    describe("Component changes during development", function () {
      let componentDom;
      let dependencyDom;

      before(async function () {
        await fs.promises.writeFile(
          headerPath,
          originalHeader.replace("<header>", "<header>Edited component "),
        );
        const componentResponse = await fetch(`${hostname}/`);
        componentDom = new JSDOM(await componentResponse.text());
        await fs.promises.writeFile(messagePath, 'export const message = "Updated dependency";\n');
        const dependencyResponse = await fetch(`${hostname}/`);
        dependencyDom = new JSDOM(await dependencyResponse.text());
      });

      it("should pick up direct component edits without restarting", function () {
        expect(componentDom.window.document.querySelector("app-header").textContent).to.contain(
          "Edited component Original header",
        );
      });

      it("should pick up transitive dependency edits without restarting", function () {
        expect(dependencyDom.window.document.querySelector("app-header").textContent).to.contain(
          "Edited component Updated dependency",
        );
      });

      after(async function () {
        await fs.promises.writeFile(headerPath, originalHeader);
        await fs.promises.writeFile(messagePath, originalMessage);
      });
    });

    describe("Recovery after renderer errors", function () {
      let failures;
      let response;
      let dom;

      before(async function () {
        try {
          await fs.promises.writeFile(
            messagePath,
            'throw new Error("Prerender failure");\nexport const message = "Broken";\n',
          );
          failures = await Promise.all([
            fetch(`${hostname}/`),
            fetch(`${hostname}/`),
            fetch(`${hostname}/`),
          ]);
        } finally {
          await fs.promises.writeFile(messagePath, originalMessage);
        }
        response = await fetch(`${hostname}/`);
        dom = new JSDOM(await response.text());
      });

      it("should return an error for each failed prerender", function () {
        expect(failures.map((response) => response.status)).to.deep.equal([500, 500, 500]);
      });

      it("should render successfully after the component is repaired", function () {
        expect(response.status).to.equal(200);
        expect(dom.window.document.querySelector("app-header").textContent).to.contain(
          "Original header",
        );
      });
    });

    describe("API route response", function () {
      let response;
      let data;

      before(async function () {
        response = await fetch(`${hostname}/api/status`);
        data = await response.json();
      });

      it("should continue serving the API normally", function () {
        expect(response.status).to.equal(200);
        expect(data).to.deep.equal({ ok: true });
      });
    });

    describe("Unknown page response", function () {
      let response;

      before(async function () {
        response = await fetch(`${hostname}/missing/`);
      });

      it("should return a 404 status", function () {
        expect(response.status).to.equal(404);
      });
    });

    describe("Development output", function () {
      it("should avoid writing production HTML", function () {
        expect(fs.readdirSync(path.join(outputPath, ".greenwood"))).not.to.include("index.html");
        expect(fs.existsSync(path.join(outputPath, "public"))).to.equal(false);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await new Promise((resolve) => blocker.close(resolve));
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
