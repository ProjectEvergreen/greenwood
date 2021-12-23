/*
 * Use Case
 * Run Greenwood and get external  custom resource plugin and default workspace.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with expected artists data as static files using a custom template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const customExternalSourcesPlugin = {
 *   type: 'source',
 *   name: 'source-plugin-analogstudios',
 *   provider: () => {
 *     // see complete implementation in the greenwood.config.js file used for this spec
 *   }
 * }
 * 
 * {
 *   plugins: [
 *     customExternalSourcesPlugin
 *   ]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     about.html
 *   templates/
 *     artist.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import glob from 'glob-promise';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Sources Plugin and Custom Template';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const publicDir = path.join(outputPath, 'public');
  let runner;

  before(function() {
    this.context = {
      publicDir
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    // no home page?
    // runSmokeTest(['public', 'index'], LABEL);

    describe('About Page', function() {
      let pages;
      let dom;

      before(async function() {
        pages = await glob(`${publicDir}/about/index.html`);  
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about/index.html'));
      });

      it('should emit one about page', function() {
        expect(pages.length).to.equal(1);
      });

      it('should have expected heading content on the about page', function() {
        const heading = dom.window.document.querySelectorAll('body h1'); 
        
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('About Us');
      });

      it('should have expected paragraph content on the about page', function() {
        const paragraph = dom.window.document.querySelectorAll('body p'); 
        
        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.equal('Lorem ipsum.');
      });
    });
    
    describe('Artists Pages', function() {
      let fixtureData = {};
      let pages = [];
      let doms = [];

      before(async function() {
        fixtureData = JSON.parse(await fs.readFile(new URL('./data.json', import.meta.url), 'utf-8'));
        pages = await glob(`${publicDir}/artists/**/index.html`);  
        doms = await Promise.all(pages.map(async (path) => {
          return JSDOM.fromFile(path);
        }));
      });

      it('should emit one about page', function() {
        expect(pages.length).to.equal(3);
      });

      it('should have expected heading content for each artist page template', function() {
  
        doms.forEach((dom) => {
          const headings = dom.window.document.querySelectorAll('body h1');
          
          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal('Welcome to the artist page.');
        });
      });

      it('should have expected artist paragraph content for each artist page', function() {
        doms.forEach((dom, idx) => {
          const paragraphs = dom.window.document.querySelectorAll('body p');
          
          expect(paragraphs.length).to.equal(1);
          expect(paragraphs[0].textContent).to.equal(fixtureData[idx].bio);
        });
      });

      it('should have expected artist image content for each artist page', function() {
        doms.forEach((dom, idx) => {
          const images = dom.window.document.querySelectorAll('body img');
          
          expect(images.length).to.equal(1);
          expect(images[0].getAttribute('src')).to.equal(fixtureData[idx].imageUrl);
        });
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});