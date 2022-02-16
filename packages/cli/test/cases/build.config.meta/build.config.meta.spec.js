/*
 * Use Case
 * Run Greenwood with meta in Greenwood config and a default workspace with a nested route.
 *
 * User Result
 * Should generate a bare bones Greenwood build with one nested About page w/ custom meta data.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default w/ nested page
 *  src/
 *   pages/
 *     about/
 *       index.md
 *     hello.md
 *     index.md
 *   template/
 *     app.html
 *     page.html
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import chai from 'chai';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Meta Configuration and Nested Workspace';
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

    describe('Index (home) page with custom meta data', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have a <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('My Custom Greenwood App');
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const indexPageHeading = 'Greenwood';
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
        const paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });

      it('should have a <meta> tag with custom og:site content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"');

        console.debug({ metaElement });
        expect(metaElement.getAttribute('content')).to.be.equal('The Greenhouse I/O');
      });

      it('should have a <meta> tag with custom og:url content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:url"]');

        expect(metaElement.getAttribute('content')).to.be.equal('https://www.thegreenhouse.io');
      });

      it('should have a <meta> tag with custom twitter:site content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="twitter:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('@thegreenhouseio');
      });
    });

    describe('Nested About page meta data', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', './index.html'));
      });

      it('should output an index.html file within the about page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', './index.html'))).to.be.true;
      });

      it('should have a <meta> tag with custom og:site content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"');

        console.debug({ metaElement });
        expect(metaElement.getAttribute('content')).to.be.equal('The Greenhouse I/O');
      });

      it('should have a <meta> tag with custom og:url content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:url"]');

        expect(metaElement.getAttribute('content')).to.be.equal('https://www.thegreenhouse.io');
      });

      it('should have a <meta> tag with custom twitter:site content in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="twitter:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('@thegreenhouseio');
      });
    });

    describe('favicon', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have our custom config <link> tag with shortcut icon in the <head> for the index page', function() {
        const linkElement = dom.window.document.querySelector('head link[rel="shortcut icon"]');

        expect(linkElement.getAttribute('href')).to.be.equal('/assets/images/favicon.ico');
      });

      it('should have our custom config <link> tag with icon in the <head> for the index page', function() {
        const linkElement = dom.window.document.querySelector('head link[rel="icon"]');

        expect(linkElement.getAttribute('href')).to.be.equal('/assets/images/favicon.ico');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});