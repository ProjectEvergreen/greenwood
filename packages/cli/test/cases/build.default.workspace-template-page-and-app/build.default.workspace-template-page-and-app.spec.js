/*
 * Use Case
 * Run Greenwood build command with no config and custom page (and app) template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page template.
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
 *     app-template-one.js
 *     app-template-two.js
 *     page-template-one.js
 *     page-template-two.js
 *   styles/
 *     app-template-one.css
 *     app-template-two.css
 *     page-template-one.css
 *     page-template-two.css
 *   templates/
 *     app.html
 *     page.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App and Page Templates';
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
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('Custom App and Page Templates', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the specific element we added as part of our custom page template', function() {
        const customElement = dom.window.document.querySelectorAll('div.owen-test');

        expect(customElement.length).to.equal(1);
      });

      describe('merge order for app and page template <head> tags', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('head > script');
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

        it('should merge page template <script> tags after app template <script> tags', function() {
          expect(scriptTags[0].src).to.match(/app-template-one.*.js/);
          expect(scriptTags[1].src).to.match(/app-template-two.*.js/);
          expect(scriptTags[2].textContent).to.contain('console.log("this should not break anything :)");');
          expect(scriptTags[3].src).to.match(/page-template-one.*.js/);
          expect(scriptTags[4].src).to.match(/page-template-two.*.js/);

          scriptTags.forEach((scriptTag) => {
            expect(scriptTag.type).to.equal('module');
          });
        });

        it('should merge page template <link> tags after app template <link> tags', function() {
          expect(linkTags[0].href).to.match(/app-template-one.*.css/);
          expect(linkTags[1].href).to.match(/app-template-two.*.css/);
          expect(linkTags[2].href).to.match(/page-template-one.*.css/);
          expect(linkTags[3].href).to.match(/page-template-two.*.css/);

          linkTags.forEach((linkTag) => {
            expect(linkTag.rel).to.equal('stylesheet');
          });
        });

        it('should merge page template <style> tags after app template <style> tags', function() {
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