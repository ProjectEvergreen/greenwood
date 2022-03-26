/*
 * Use Case
 * Run Greenwood build command with prerender config set to true.
 *
 * User Result
 * Should generate a Greenwood build with puppeteer generated output for Web Components.
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
 *     header.js
 *   pages/
 *     index.html
 */
import chai from 'chai';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Prerender Configuration turned off';
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
  
    describe('Default output for index.html', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      describe('head section tags', function() {
        let metaTags;

        before(function() {
          metaTags = dom.window.document.querySelectorAll('head > meta');
        });

        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;
    
          expect(title).to.be.equal('My App');
        });

        it('should have five default <meta> tags in the <head>', function() {
          expect(metaTags.length).to.be.equal(5);
        });

        it('should have default mobile-web-app-capable <meta> tag', function() {
          const mwacMeta = metaTags[2];

          expect(mwacMeta.getAttribute('name')).to.be.equal('mobile-web-app-capable');
          expect(mwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-capable <meta> tag', function() {
          const amwacMeta = metaTags[3];

          expect(amwacMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-capable');
          expect(amwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-status-bar-style <meta> tag', function() {
          const amwasbsMeta = metaTags[4];

          expect(amwasbsMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-status-bar-style');
          expect(amwasbsMeta.getAttribute('content')).to.be.equal('black');
        });
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('body h1').textContent;

        expect(heading).to.equal('Welcome to Greenwood!');
      });

      it('should have prerendered content from <app-header> component', function() {
        const appHeader = dom.window.document.querySelectorAll('body app-header');
        const header = dom.window.document.querySelectorAll('body header');

        expect(appHeader.length).to.equal(1);
        expect(header.length).to.equal(1);
        expect(header[0].textContent).to.equal('This is the header component.');
      });
    });

    after(async function() {
      // using unlink instead of runner.teardown since when auto-install puppeteer
      // our spawned process of a spawned process does not clean up as expected
      await fs.rm(path.join(outputPath, 'package.json'), { recursive: true, force: true });
      await fs.rm(path.join(outputPath, 'package-lock.json'), { recursive: true, force: true });
      await fs.rm(path.join(outputPath, '.greenwood'), { recursive: true, force: true });
      await fs.rm(path.join(outputPath, 'node_modules'), { recursive: true, force: true });
      await fs.rm(path.join(outputPath, 'public'), { recursive: true, force: true });
    });
  });
});