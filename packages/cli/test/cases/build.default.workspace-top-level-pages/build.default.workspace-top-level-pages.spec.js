/*
 * Use Case
 * Run Greenwood with default config and mixed HTML and markdown top level pages.
 *
 * Result
 * Test for correct page output and layout.
 *
 * Command
 * greenwood build
 *
 * User Config
 * None (Greenwood default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     contact.md
 *     index.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Top Level Pages';
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

    describe('Home (index) Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have custom <meta> tag in the <head>', function() {
        const customMeta = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter(meta => meta.getAttribute('property') === 'og:description');

        expect(customMeta.length).to.be.equal(1);
        expect(customMeta[0].getAttribute('content')).to.be.equal('My custom meta content.');
      });

      it('should have the correct <title> for the home page', function() {
        const titleTags = dom.window.document.querySelectorAll('title');

        expect(titleTags.length).to.equal(1);
        expect(titleTags[0].textContent).to.equal('Top Level Test');
      });

      it('should have the correct content for the home page', function() {
        const h1Tags = dom.window.document.querySelectorAll('h1');

        expect(h1Tags.length).to.equal(1);
        expect(h1Tags[0].textContent).to.equal('Hello from the home page!!!!');
      });
    });

    describe('About Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', 'index.html'));
      });

      it('should create a top level about page with a directory and index.html', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', 'index.html'))).to.be.true;
      });

      it('should have the correct content for the about page', function() {
        const h1Tags = dom.window.document.querySelectorAll('h1');
        const pTags = dom.window.document.querySelectorAll('p');

        expect(h1Tags.length).to.equal(1);
        expect(h1Tags[0].textContent).to.equal('Hello from about.html');

        expect(pTags.length).to.equal(1);
        expect(pTags[0].textContent).to.equal('Lorum Ipsum');
      });
    });

    describe('Contact Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'contact', 'index.html'));
      });

      it('should create a top level contact page with a directory and index.html', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'contact', 'index.html'))).to.be.true;
      });
  
      it('should have the correct content for the contact page', function() {
        const h3Tags = dom.window.document.querySelectorAll('h3');
        const pTags = dom.window.document.querySelectorAll('p');

        expect(h3Tags.length).to.equal(1);
        expect(h3Tags[0].textContent).to.equal('Contact Page');

        expect(pTags.length).to.equal(1);
        expect(pTags[0].textContent).to.equal('Thanks for contacting us.');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});