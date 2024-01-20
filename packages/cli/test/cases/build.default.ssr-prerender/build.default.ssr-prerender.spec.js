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
 *   templates/
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

      it('should have one top level <app-footer> element with a <template> with an open shadowroot', function() {
        expect(dom.window.document.querySelectorAll('app-footer template[shadowrootmode="open"]').length).to.equal(1);
        expect(dom.window.document.querySelectorAll('template').length).to.equal(1);
      });

      it('should have the expected SSR Shadow DOM content for the footer', function() {
        const wrapper = new JSDOM(dom.window.document.querySelectorAll('app-footer template[shadowrootmode="open"]')[0].innerHTML);
        const footer = wrapper.window.document.querySelectorAll('footer');

        expect(footer.length).to.equal(1);
        expect(footer[0].textContent).to.equal('This is the footer component.');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});