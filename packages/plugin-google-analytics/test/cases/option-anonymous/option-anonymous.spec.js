/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin with IP anonymization set to false.
 *
 * User Result
 * Should generate a bare bones Greenwood build with Google Analytics tracking snippet injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginGoogleAnalytics } from '@greenwood/plugin-google-analytics';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginGoogleAnalytics({
 *       analyticsId: 'UA-123456-1',
 *       anonymous: false
 *     })
 *  }]
 *
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Google Analytics Plugin with IP Anonymization tracking set to false and Default Workspace";
  const mockAnalyticsId = "UA-123456-1";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Initialization script", function () {
      let inlineScript;

      before(async function () {
        const dom = await JSDOM.fromFile(
          fileURLToPath(new URL("index.html", this.context.publicDir)),
        );
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );

        inlineScript = Array.prototype.slice.call(scriptTags).filter((script) => {
          return !script.src && !script.getAttribute("data-state");
        });
      });

      it("should be one inline <script> tag", function () {
        expect(inlineScript.length).to.be.equal(1);
      });

      it("should have the expected code with users analyticsId", function () {
        const expectedContent = `
            globalThis.dataLayer = globalThis.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${mockAnalyticsId}', { 'anonymize_ip': false });
        `;

        expect(inlineScript[0].textContent.trim().replace(/\n/g, "").replace(/ /g, "")).to.contain(
          expectedContent.trim().replace(/\n/g, "").replace(/ /g, ""),
        );
      });
    });

    describe("Tracking script", function () {
      let trackingScript;

      before(async function () {
        const dom = await JSDOM.fromFile(
          fileURLToPath(new URL("index.html", this.context.publicDir)),
        );
        const scriptTags = dom.window.document.querySelectorAll("head script");

        trackingScript = Array.prototype.slice.call(scriptTags).filter((script) => {
          return script.src === `https://www.googletagmanager.com/gtag/js?id=${mockAnalyticsId}`;
        });
      });

      it("should have one <script> tag for loading the Google Analytics tracker", function () {
        expect(trackingScript.length).to.be.equal(1);
      });

      it("should be an async <script> tag for loading the Google Analytics tracker", function () {
        const isAsync = trackingScript[0].async !== null;

        expect(isAsync).to.be.equal(true);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
