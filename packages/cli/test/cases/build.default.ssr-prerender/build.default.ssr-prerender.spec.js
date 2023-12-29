/*
 * Use Case
 * Run Greenwood with an SSR route that is prerender using configuration.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a prerender SSR application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     footer.js
 *   pages/
 *     index.js
 *   layouts/
 *     app.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) with prerender configuration';
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

    describe('Build command that prerenders SSR pages', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the expected SSR page content in the HTML', function() {
        const headings = dom.window.document.querySelectorAll('body h1');

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('This is the home page.');
      });

      it('should have one top level <app-header> tag with a <layout> with an open shadowroot', function() {
        const header = dom.window.document.querySelectorAll('app-header template[shadowroot="open"]');
        const headerContentsDom = new JSDOM(header[0].innerHTML);
        const heading = headerContentsDom.window.document.querySelectorAll('h1');

        expect(header.length).to.equal(1);
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent.trim()).to.equal('This is the header component.');
      });

      // specifically to test for these bugs
      // https://github.com/ProjectEvergreen/greenwood/issues/1044
      // https://github.com/ProjectEvergreen/greenwood/issues/988#issuecomment-1288168858
      it('should have one two top level <app-social-links> tag with expected link items', function() {
        // one set comes from the HTML, one from the SSR page
        const links = dom.window.document.querySelectorAll('body > app-social-links ul li a');

        expect(links.length).to.equal(6);
      });

      it('should have one top level <app-footer> tag with expected link items', function() {
        const footer = dom.window.document.querySelectorAll('app-footer');
        const paragraph = footer[0].querySelectorAll('p');
        const links = footer[0].querySelectorAll('app-social-links ul li a');

        expect(footer.length).to.equal(1);
        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent.trim()).to.equal('This is the footer component.');
        expect(links.length).to.equal(3);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});