/*
 * Use Case
 * Run Greenwood build command when using the puppeteer renderer plugin for prerendering.
 *
 * User Result
 * Should generate a Greenwood build with puppeteer generated output for Web Components.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [ 
 *     ...greenwoodPluginRendererPuppeteer()
 *   ]
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
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Puppeteer prerendering enabled';
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
      let raw;

      before(async function() {
        const outputFile = path.join(this.context.publicDir, './index.html');

        raw = await fs.readFile(outputFile, 'utf-8');
        dom = await JSDOM.fromFile(outputFile);
      });

      describe('head section tags', function() {
        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;
    
          expect(title).to.be.equal('My App');
        });

        it('should have one <style> tag in the <head> from puppeteer', function() {
          const styleTag = dom.window.document.querySelectorAll('head style');
    
          expect(raw).to.contain('<!-- Shady DOM styles for app-header -->');
          expect(styleTag.length).to.be.equal(1);
          expect(styleTag[0].textContent).to.contain('body[unresolved]');
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
        expect(header[0].textContent.trim()).to.equal('This is the header component.');
      });
    });
  });

  after(async function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});