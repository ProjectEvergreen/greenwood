/*
 * Use Case
 * Run Greenwood build command with no config and dynamic (e.g. .js) custom page (and app) layouts.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page layout.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 *   layouts/
 *     app.js
 *     page.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Dynamic App and Page Layouts using JavaScript';
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

    runSmokeTest(['public'], LABEL);

    describe('Custom App and Page Layout', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the expected <title> tag from the dynamic app layout', function() {
        const title = dom.window.document.querySelectorAll('head title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('App Layout');
      });

      it('should have the expected <h1> tag from the dynamic app layout', function() {
        const heading = dom.window.document.querySelectorAll('h1');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('App Layout');
      });

      it('should have the expected <h2> tag from the dynamic page layout', function() {
        const heading = dom.window.document.querySelectorAll('h2');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Page Layout');
      });

      it('should have the expected content from the index.md', function() {
        const heading = dom.window.document.querySelectorAll('h3');
        const paragraph = dom.window.document.querySelectorAll('p');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Home Page');

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.equal('Coffey was here');
      });

      it('should have the expected <footer> tag from the dynamic app layout', function() {
        const year = new Date().getFullYear();
        const footer = dom.window.document.querySelectorAll('footer');

        expect(footer.length).to.equal(1);
        expect(footer[0].textContent).to.equal(`${year}`);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});