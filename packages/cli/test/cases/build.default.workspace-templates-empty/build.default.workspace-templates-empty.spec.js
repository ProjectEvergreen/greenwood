/*
 * Use Case
 * Run Greenwood build command with no config and custom page templates to ensure Greenwood
 * can build various  "states" of in development HTML files.
 * https://github.com/ProjectEvergreen/greenwood/issues/627
 *
 * User Result
 * Should generate a Greenwood build with custom page templates.
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
 *     index.html
 *     no-body.html
 *     no-head.html
 *     shell.html
 *   scripts/
 *     main.js
 *   styles/
 *     main.css
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
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Page Templates for HTML "forgiveness"';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom Page Templates', function() {

      describe('Standard page with <html>, <head>, and <body> tags using pages/index.html', function() {
        let dom;
        let scriptTags;
        let linkTags;
        let headingTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        });

        before(function() {
          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          headingTags = dom.window.document.querySelectorAll('body > h1');
        });

        it('should have 1 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(1);
        });

        it('should have 1 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(1);
        });

        it('should have the expected heading tags in the body', function() {
          expect(headingTags.length).to.equal(1);
        });

        it('should have the expected content in the heading tag', function() {
          expect(headingTags[0].textContent).to.equal('This is the home page.');
        });
      });

      describe('Standard page with <html> and <head> tags but NO <body> tag, using pages/no-body.html', function() {
        let dom;
        let scriptTags;
        let linkTags;
        let bodyTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'no-body/index.html'));
        });

        before(function() {
          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          bodyTags = dom.window.document.querySelectorAll('body');
        });

        it('should have 1 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(1);
        });

        it('should have 1 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(1);
        });

        it('should have the expected content in the <body> tag', function() {
          expect(bodyTags[0].textContent.replace(/\n/g, '').trim()).to.equal('');
        });
      });

      describe('Standard page with <html> and <body> tags but NO <head> tag, using pages/no-head.html', function() {
        let dom;
        let scriptTags;
        let linkTags;
        let bodyTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'no-head/index.html'));
        });

        before(function() {
          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          bodyTags = dom.window.document.querySelectorAll('body');
        });

        it('should have 0 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(0);
        });

        it('should have 0 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(0);
        });

        it('should have the expected content in the <body> tag', function() {
          expect(bodyTags[0].textContent.replace(/\n/g, '').trim()).to.equal('This is the no head page.');
        });
      });

      describe('Standard page with <html> tag but NO <body> and <head> tags, using pages/shell.html', function() {
        let dom;
        let scriptTags;
        let linkTags;
        let bodyTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'shell/index.html'));
        });

        before(async function() {
          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          bodyTags = dom.window.document.querySelectorAll('body');
        });

        it('should have 0 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(0);
        });

        it('should have 0 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(0);
        });

        it('should have the expected content in the <body> tag', function() {
          expect(bodyTags[0].textContent.replace(/\n/g, '').trim()).to.equal('');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});