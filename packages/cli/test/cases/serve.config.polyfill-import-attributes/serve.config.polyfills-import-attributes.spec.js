/*
 * Use Case
 * Run Greenwood serve command with import attributes polyfill flag enabled.
 *
 * User Result
 * Should start the production server and have all the expected import attributes polyfill behaviors..
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * polyfill: {
 *   importAttributes: ['css', 'json']
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero.js
 *     hero.css
 *     hero.json
 *   index.html
 * greenwood.config.js
 * package.json
 *
 */
import chai from 'chai';
import fs from 'fs';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles, getDependencyFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Import Attributes Polyfill Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputUrl = new URL('.', import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const greenwoodRouterLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/router.js`,
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs
      ]);
      runner.runCommand(cliPath, 'build');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'serve', { async: true });
      });
    });

    describe('Import Attributes Polyfill Behaviors for the initiating JavaScript file (hero.js) being served and bundled', function() {
      const jsHash = 'f22adf2c';
      let response = {};
      let text;
      let contents;

      before(async function() {
        response = await fetch(`${hostname}/hero.${jsHash}.js`);
        text = await response.clone().text();
        contents = await fs.promises.readFile(new URL(`./public/hero.${jsHash}.js`, outputUrl), 'utf-8');
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should not contain import attributes syntax in the response or bundled output', function(done) {
        expect(text.replace(/ /g, '')).to.not.contain('with{type:');
        expect(contents.replace(/ /g, '')).to.not.contain('with{type:');

        done();
      });

      it('should contain import attributes polyfill syntax for CSS', function(done) {
        expect(text).to.contain('const t=new CSSStyleSheet;t.replaceSync(":host h2{font-size:3em}");');
        expect(contents).to.contain('const t=new CSSStyleSheet;t.replaceSync(":host h2{font-size:3em}");');

        done();
      });

      it('should contain import attributes polyfill syntax for JSON', function(done) {
        expect(text).to.contain('var e={msg:"Hello World"};');
        expect(contents).to.contain('var e={msg:"Hello World"};');

        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});