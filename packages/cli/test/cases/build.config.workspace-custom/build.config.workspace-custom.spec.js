/*
 * Use Case
 * Run Greenwood build command with custom workspace directory (absolute path) and custom pages.
 *
 * User Result
 * Should generate a Greenwood build from www directory with about and index pages.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: fileURLToPath(new URL('./www', import.meta.url))
 * }
 *
 * User Workspace
 * www/
 *   pages/
 *     about.md
 *     index.md
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Configuration for Workspace (www) and Default Greenwood configuration';
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

    describe('Custom About page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', './index.html'));
      });

      it('should output an index.html file within the custom about page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the custom about page in the about directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal('Nested Custom About Page');
      });

      it('should have the expected paragraph text within the custom about page in the about directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal('This is a custom about page built by Greenwood.');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});