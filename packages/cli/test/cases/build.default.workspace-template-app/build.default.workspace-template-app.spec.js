/*
 * Use Case
 * Run Greenwood build command with no config and custom app template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom app template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   templates/
 *     app.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App Template';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom App Template', function() {
      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom app template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific element we added as part of our custom app template', function() {
        const customParagraph = dom.window.document.querySelector('body p').textContent;

        expect(customParagraph).to.equal('My Custom App Template');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});