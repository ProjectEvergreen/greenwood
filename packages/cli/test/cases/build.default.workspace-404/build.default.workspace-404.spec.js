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
 *     404.js
 *     header.js
 *   styles/
 *     404.css
 *     theme.css
 *   templates/
 *     app.html
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom 404 Page and App Template';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(true);
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('Custom 404 Page with App Template', function() {
      let dom;
      let jsFiles;
      let cssFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, '404.html'));
        jsFiles = await glob.promise(path.join(this.context.publicDir, '404.*.js'));
        cssFiles = await glob.promise(path.join(this.context.publicDir, 'styles/404.*.css'));
      });

      before(function() {
        scriptTags = dom.window.document.querySelectorAll('head > script');
        linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
        headingTags = dom.window.document.querySelectorAll('body > h1');
      });

      describe('404 page static assets in the output directory', function() {
        it('should have 1 404 JS file', function() {
          expect(jsFiles.length).to.equal(1);
        });

        it('should have 1 404 CSS file', function() {
          expect(cssFiles.length).to.equal(1);
        });
      });

      describe('404 page <head>', function() {
        // title tag
        it('should have 2 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(2);
        });

        it('should have 2 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(2);
        });

        it('should have 1 app template specific <script> tag in the <head>', function() {
          const scriptTagsTemplate = Array.from(scriptTags).filter(script => script.getAttribute('src').indexOf('404') < 0);
          
          expect(scriptTagsTemplate.length).to.equal(1);
        });

        it('should have 1 app template specific <link> tag in the <head>', function() {
          const linkTagsTemplate = Array.from(linkTags).filter(link => link.getAttribute('href').indexOf('404') < 0);
          
          expect(linkTagsTemplate.length).to.equal(1);
        });

        it('should have 1 404 page specific <script> tags in the <head>', function() {
          const scriptTags404 = Array.from(scriptTags).filter(script => script.getAttribute('src').indexOf('404') >= 0);
          
          expect(scriptTags404.length).to.equal(1);
        });

        it('should have 1 404 page specific <link> tags in the <head>', function() {
          const linkTags404 = Array.from(linkTags).filter(link => link.getAttribute('href').indexOf('404') >= 0);
          
          expect(linkTags404.length).to.equal(1);
        });
      });

      describe('404 page <body>', function() {
        it('should have <app-header> compoonent pre-rendered content in the <body>', function() {
          const header = dom.window.document.querySelectorAll('body header');
          
          expect(header.length).to.equal(1);
          expect(header[0].textContent).to.equal('This is the header component.');
        });

        it('should have 404 page specific content in the <body>', function() {
          const heading = dom.window.document.querySelectorAll('body h1');
          
          expect(heading.length).to.equal(1);
          expect(heading[0].textContent).to.equal('This is not the page you are looking for.');
        });
        
        // TODO sourceMappingURL=404.html.map
      });

    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});