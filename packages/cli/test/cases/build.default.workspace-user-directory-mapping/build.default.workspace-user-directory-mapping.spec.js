/*
 * Use Case
 * Run Greenwood build command with no config and custom workspace testing for file / directory name collisions.
 * See this issue for more details: https://github.com/ProjectEvergreen/greenwood/issues/132
 *
 * User Result
 * Should generate a bare bones Greenwood build with out any errors due to naming.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       header.js
 *   pages/
 *     plugins/
 *       index-hooks.md
 *       index.md
 *     index.md
 *     pages.md
 *   services/
 *     pages/
 *       pages.js
 *     components.js
 *   templates/
 *     page.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Naming Collisions';
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
    before(async () => {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Output Folder Structure and Home Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it('should output an index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should output one JS bundle files', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*.js'))).to.have.lengthOf(1);
      });

      it('should have one <script> tags in the <head>', async function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(1);
      });

      it('should have content in the <body>', function() {
        const h3 = dom.window.document.querySelector('body h3');
        const p = dom.window.document.querySelector('body p');

        expect(h3.textContent).to.be.equal('Greenwood');
        expect(p.textContent).to.be.equal('This is the home page built by Greenwood. Make your own pages in src/pages/index.js!');
      });

      it('should have a <x-header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body x-header');

        expect(header.length).to.be.equal(1);
      });
    });

    describe('Describe Pages page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'pages/index.html'));
      });

      it('should output an index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'pages', 'index.html'))).to.be.true;
      });

      it('should output one JS bundle files', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*.js'))).to.have.lengthOf(1);
      });

      it('should have one <script> tags in the <head>', async function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(1);
      });

      it('should have content in the <body>', function() {
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelector('body p');

        expect(h2.textContent).to.be.equal('Pages page');
        expect(p.textContent).to.be.equal('This is a custom about page built by Greenwood.');
      });

      it('should have a <x-header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body x-header');

        expect(header.length).to.be.equal(1);
      });
    });

    describe('Describe a page with index in the route filename', function() {
      let pluginIndexPageDom;
      let pluginHooksIndexPageDom;

      before(async function() {
        pluginIndexPageDom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'plugins/index.html'));
        pluginHooksIndexPageDom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'plugins/index-hooks/index.html'));
      });

      it('should output an index.html file for the plugins index page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'plugins', 'index.html'))).to.be.true;
      });

      it('should output an index.html file for the plugins page with index in the filename', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'plugins/index-hooks', 'index.html'))).to.be.true;
      });

      it('should have the expected content in the <body> of the plugins page index.html', function() {
        const h2 = pluginIndexPageDom.window.document.querySelector('body h2');
        const p = pluginIndexPageDom.window.document.querySelector('body p');

        expect(h2.textContent).to.be.equal('Plugins');
        expect(p.textContent).to.be.equal('Lorum Ipsum');
      });

      it('should have the expected content in the <body> of the plugins hook index.html with index in the route name', function() {
        const h2 = pluginHooksIndexPageDom.window.document.querySelector('body h2');
        const p = pluginHooksIndexPageDom.window.document.querySelector('body p');

        expect(h2.textContent).to.be.equal('Index Hooks');
        expect(p.textContent).to.be.equal('Some more Lorum Ipsum.');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});