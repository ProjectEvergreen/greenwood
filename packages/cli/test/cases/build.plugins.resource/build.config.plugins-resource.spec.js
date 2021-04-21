/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace.
 *
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
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom FooResource Plugin and Default Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    describe('Transpiling and DOM Manipulation', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have expected text executed from my-custom-file.foo in the DOM', function() {
        const placeholder = dom.window.document.querySelector('body h6');

        expect(placeholder.textContent).to.be.equal('hello from my-custom-file.foo');
      });
    });
  });

  after(function() {
    runner.teardown();
  });

});