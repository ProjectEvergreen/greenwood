/*
 * Use Case
 * Run Greenwood with a custom context plugin that provides custom templates and resources.  (e.g. a theme pack)
 * Uaer Result
 * Should generate a bare bones Greenwood build with expected custom file (.foo) behavior.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * class FooResource extends ResourceInterface {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 * 
 * {
 *   plugins: [{
 *     type: 'resource',
 *     name: 'plugin-foo',
 *     provider: (compilation, options) => new FooResource(compilation, options)
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     index.html
 *   foo-files/
 *     my-custom-file.foo
 *     my-other-custom-file.foo
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Context Plugin and Default Workspace (Theme Pack)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const themePacktemplates = await getDependencyFiles(
        `${__dirname}/fixtures/layouts/*.html`, 
        `${outputPath}/node_modules/my-theme-pack/dist/layouts`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...themePacktemplates
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    describe('Custom Templates', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      xit('should have expected text from from a mock package layout/app.html in node_modules/', function() {

      });

      it('should have expected text from from a mock package layout/page.html in node_modules/', function() {
        const pageTemplateHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageTemplateHeading.textContent).to.be.equal('This is a custom page template from the custom layouts directory.');
      });

      it('should have expected text from user workspace pages/index.md', function() {
        const pageHeadingPrimary = dom.window.document.querySelectorAll('body h2')[0];
        const pageHeadingSecondary = dom.window.document.querySelectorAll('body h3')[0];

        expect(pageHeadingPrimary.textContent).to.be.equal('Context Plugin Theme Pack Test');
        expect(pageHeadingSecondary.textContent).to.be.equal('From user workspace pages/index.md');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});