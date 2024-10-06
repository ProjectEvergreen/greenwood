/*
 * Use Case
 * Run Greenwood build with CSS Modules plugin.
 *
 * User Result
 * Should generate a Greenwood project with CSS Modules properly transformed.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginCssModules } import '@greenwood/plugin-css-modules';
 *
 * {
 *   plugins: [
 *     greenwoodPluginCssModules()
 *  ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     header/
 *       header.js
 *       header.module.css
 *     index.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Configuration for CSS Modules and pre-rendering';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Page referencing external nested CSS file', function() {
      it('should not have any references to CSS modules in the JavaScript bundle', function() {
        const jsFiles = glob.sync(path.join(this.context.publicDir, 'header*.*.js'));
        const js = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(jsFiles.length).to.equal(1);

        expect(js).to.not.contain('from"/header.module');
      });

      it('should have transformed class names in the JavaScript bundle', function() {
        const jsFiles = glob.sync(path.join(this.context.publicDir, 'header*.*.js'));
        const js = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(js).to.contain('class="header-');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});