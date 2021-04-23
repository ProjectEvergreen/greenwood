/*
 * Use Case
 * Run Greenwood build command with no config and custom page template.
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
 *   scripts
 *     main.js
 *   styles/
 *     theme.css
 *   templates/
 *     page.html
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Page Template';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
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

    describe('Custom Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      describe('correct merge order for default app and custom page template <head> tags', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('head > script');
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
          styleTags = dom.window.document.querySelectorAll('head > style');
        });

        it('should have 1 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(1);
        });

        it('should have 1 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(1);
        });

        it('should have 2 <style> tags in the <head> (1 + one from Puppeteer)', function() {
          expect(styleTags.length).to.equal(2);
        });

        it('should add one page template <script> tag', function() {
          expect(scriptTags[0].type).to.equal('module');
          expect(scriptTags[0].src).to.match(/main.*.js/);
        });

        it('should add one page template <link> tag', function() {
          expect(linkTags[0].rel).to.equal('stylesheet');
          expect(linkTags[0].href).to.match(/styles\/theme.[a-z0-9]{8}.css/);
        });

        it('should add one page template <style> tag', function() {
          // offset index by one since first <style> tag is from Puppeteer
          expect(styleTags[1].textContent).to.contain('.owen-test');
        });
      });
  
      describe('custom inline <style> tag in the <head> of a page template', function() {
        let dom;
  
        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        });

        it('should have the specific element we added as part of our custom page template', function() {
          const customElement = dom.window.document.querySelectorAll('div.owen-test');
  
          expect(customElement.length).to.equal(1);
        });
  
        it('should have the color style for the .owen-test element in the page template that we added as part of our custom style', function() {
          const customElement = dom.window.document.querySelector('.owen-test');
          const computedStyle = dom.window.getComputedStyle(customElement);
  
          expect(computedStyle.color).to.equal('blue');
        });
  
        it('should have the color styles for the h3 element that we defined as part of our custom style', function() {
          const customHeader = dom.window.document.querySelector('h3');
          const computedStyle = dom.window.getComputedStyle(customHeader);
  
          expect(computedStyle.color).to.equal('green');
        });
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});