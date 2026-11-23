/*
 * Use Case
 * Run Greenwood and correctly prerender "HTML" Web Components.
 * https://blog.jim-nielsen.com/2023/html-web-components/
 *
 * User Result
 * Should generate a static Greenwood build with the expected prerender "HTML" Web Components content.
 *
 * User Command
 * greenwood build
 *
 * User Config
 *
 * {
 *   prerender: true,
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     picture-frame.js
 *    index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Prerendering with HTML Web Components";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public"], LABEL);

    describe("Prerender HTML Web Component", function () {
      let dom;
      let pictureFrame;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        pictureFrame = dom.window.document.querySelectorAll("app-picture-frame");
      });

      it("should not have any <template> tags within the document", function () {
        expect(dom.window.document.querySelectorAll("template").length).to.equal(0);
      });

      it("should only have one <app-picture-frame> tag", function () {
        expect(pictureFrame.length).to.equal(1);
      });

      it("should have the expected title attribute content in the heading of HTML", () => {
        const heading = pictureFrame[0].querySelectorAll(".picture-frame .heading");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("Greenwood");
      });

      it("should have the expected image from userland in the HTML", () => {
        const img = pictureFrame[0].querySelectorAll(".picture-frame img");

        expect(img.length).to.equal(1);
        expect(img[0].getAttribute("alt")).to.equal("Greenwood logo");
        expect(img[0].getAttribute("src")).to.equal("/assets/greenwood.png");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
