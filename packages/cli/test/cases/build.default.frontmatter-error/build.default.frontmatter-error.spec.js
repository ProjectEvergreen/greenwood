/*
 * Use Case
 * Run Greenwood build with a page that has invalid YAML frontmatter, e.g. an unclosed quote.
 *
 * User Result
 * Should throw an error that names the offending page file, instead of a raw js-yaml stack trace.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     broken.html (invalid YAML frontmatter)
 *     index.html
 */
// https://github.com/ProjectEvergreen/greenwood/issues/1778
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

chai.use(chaiAsPromised);

describe("Build Greenwood With: ", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe("A page with invalid YAML frontmatter", function () {
    before(async function () {
      await runner.setup(outputPath);
    });

    it("should throw an error that the frontmatter for the page could not be parsed", async function () {
      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        'Error parsing frontmatter for page "./broken.html"',
      );
    });

    it("should report the reason from the YAML parser instead of a raw js-yaml stack trace", async function () {
      const error = await runner.runCommand(cliPath, "build").then(
        () => "",
        (err) => `${err}`,
      );

      expect(error).to.contain("unexpected end of the stream within a double quoted scalar");
      expect(error).to.not.contain("js-yaml/lib/js-yaml/loader.js");
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
