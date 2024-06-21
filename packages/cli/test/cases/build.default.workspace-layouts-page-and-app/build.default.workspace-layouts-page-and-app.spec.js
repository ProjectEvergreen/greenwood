/*
 * Use Case
 * Run Greenwood build command with no config and custom page (and app) layout.
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
 *   scripts/
 *     app-layout-one.js
 *     app-layout-two.js
 *     page-layout-one.js
 *     page-layout-two.js
 *   styles/
 *     app-layout-one.css
 *     app-layout-two.css
 *     page-layout-one.css
 *     page-layout-two.css
 *   layouts/
 *     app.html
 *     page.html
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
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App and Page Layouts';
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

      it('should have the specific element we added as part of our custom page layout', function() {
        const customElement = dom.window.document.querySelectorAll('div.owen-test');

        expect(customElement.length).to.equal(1);
      });

      describe('merge order for app and page layout <head> tags', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = Array.from(dom.window.document.querySelectorAll('head script')).filter(tag => !tag.getAttribute('data-gwd'));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          styleTags = dom.window.document.querySelectorAll('head > style');
        });

        it('should have 5 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(5);
        });

        it('should have 4 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(4);
        });

        it('should have 4 <style> tags in the <head>', function() {
          expect(styleTags.length).to.equal(4);
        });

        it('should merge page layout <script> tags after app layout <script> tags', function() {
          expect(scriptTags[0].src).to.match(/app-layout-one.*.js/);
          expect(scriptTags[1].src).to.match(/app-layout-two.*.js/);
          expect(scriptTags[2].textContent).to.contain('console.log("this should not break anything :)");');
          expect(scriptTags[3].src).to.match(/page-layout-one.*.js/);
          expect(scriptTags[4].src).to.match(/page-layout-two.*.js/);

          scriptTags.forEach((scriptTag) => {
            expect(scriptTag.type).to.equal('module');
          });
        });

        it('should merge page layout <link> tags after app layout <link> tags', function() {
          expect(linkTags[0].href).to.match(/app-layout-one.*.css/);
          expect(linkTags[1].href).to.match(/app-layout-two.*.css/);
          expect(linkTags[2].href).to.match(/page-layout-one.*.css/);
          expect(linkTags[3].href).to.match(/page-layout-two.*.css/);

          linkTags.forEach((linkTag) => {
            expect(linkTag.rel).to.equal('stylesheet');
          });
        });

        it('should merge page layout <style> tags after app layout <style> tags', function() {
          expect(styleTags[0].textContent).to.equal('span{text-align:center}');
          expect(styleTags[1].textContent).to.equal('p{margin:0 auto}');
          expect(styleTags[2].textContent).to.equal('ol{list-style:none}');
          expect(styleTags[3].textContent).to.equal('h3{text-decoration:underline}');
        });
      });

      describe('<head> "like" tags that should be in the <body>', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('body > script');
          linkTags = dom.window.document.querySelectorAll('body > link');
          styleTags = dom.window.document.querySelectorAll('body > style');
        });

        it('should have 1 <script> tag in the <body>', function() {
          expect(scriptTags.length).to.equal(1);
        });

        it('should have 1 <link> tag in the <body>', function() {
          expect(linkTags.length).to.equal(1);
        });

        it('should have 1 <style> tag in the <body>', function() {
          expect(styleTags.length).to.equal(1);
        });
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});