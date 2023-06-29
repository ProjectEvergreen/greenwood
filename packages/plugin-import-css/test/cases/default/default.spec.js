/*
 * Use Case
 * Run Greenwood with pluginImportCss plugin with default options.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) with CSS.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
 *
 * {
 *   plugins: [{
 *      ...greenwoodPluginImportCss()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   main.js
 *   styles.css
 *   pages/
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
  const LABEL = 'Import CSS Plugin with default options';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('importing CSS using ESM (import)', function() {
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      });

      it('should contain one (CSS-in) JavaScript file in the output directory', function() {
        expect(scripts.length).to.be.equal(1);
      });

      it('should have the expected output from importing styles.css in main.js', function() {
        const contents = fs.readFileSync(scripts[0], 'utf-8');

        // TODO minify CSS-in-JS?
        expect(contents).to.contain('import from styles.css: p {   color: red; }"');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});