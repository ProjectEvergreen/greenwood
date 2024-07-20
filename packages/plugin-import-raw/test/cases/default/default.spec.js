/*
 * Use Case
 * Run Greenwood and be able to load arbitrary content as a string using ESM.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) as a string value.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportRaw()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   main.js
 *   styles.css
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

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Import Raw Plugin with default options';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Importing a string of CSS using ESM (import)', function() {
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      });

      it('should contain one (CSS-in) JavaScript file in the output directory', function() {
        expect(scripts.length).to.be.equal(1);
      });

      it('should have the expected output from importing styles.css in main.js', function() {
        const contents = fs.readFileSync(scripts[0], 'utf-8');

        expect(contents).to.contain('import from styles.css: p {   color: red; }');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});