/*
 * Use Case
 * Run Greenwood with mode setting in Greenwood config set to mpa.
 *
 * User Result
 * Should generate a bare bones Greenwood build with bundle JavaScript and routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   mode: 'mpa'
 * }
 *
 * User Workspace
 * Greenwood default w/ nested page
 *  src/
 *   pages/
 *     about.md
 *     index.md
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Mode';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
    this.context = { 
      publicDir: path.join(outputPath, 'public') 
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const greenwoodRouterLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/router.js`, 
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('MPA (Multi Page Application)', function() {
      let dom;
      let aboutDom;
      let pages;
      let partials;
      let routerFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        aboutDom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about/index.html'));
        pages = await glob(`${this.context.publicDir}/*.html`);
        partials = await glob(`${this.context.publicDir}/_routes/**/*.html`);
        routerFiles = await glob(`${this.context.publicDir}/router.*.js`);
      });
      
      it('should have one <script> tag in the <head> for the router', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[type]');

        expect(scriptTags.length).to.be.equal(1);
        expect(scriptTags[0].href).to.be.contain(/router.*.js/);
        expect(scriptTags[0].type).to.be.equal('module');
      });

      it('should have one router.js file in the output directory', function() {
        expect(routerFiles.length).to.be.equal(1);
      });

      it('should have one expected inline <script> tag in the <head> for router global variables', function() {
        const inlineScriptTags = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(tag => !tag.type);

        expect(inlineScriptTags.length).to.be.equal(1);
        expect(inlineScriptTags[0].textContent).to.contain('window.__greenwood = window.__greenwood || {};');
        expect(inlineScriptTags[0].textContent).to.contain('window.__greenwood.currentTemplate = "page"');
      });

      it('should have one <router-outlet> tag in the <body> for the content', function() {
        const routerOutlets = dom.window.document.querySelectorAll('body > router-outlet');

        expect(routerOutlets.length).to.be.equal(1);
      });

      it('should have expected <greenwood-route> tags in the <body> for each page', function() {
        const routeTags = dom.window.document.querySelectorAll('body > greenwood-route');

        expect(routeTags.length).to.be.equal(3);
      });
                  
      it('should have the expected properties for each <greenwood-route> tag for the about page', function() {
        const aboutRouteTag = Array
          .from(dom.window.document.querySelectorAll('body > greenwood-route'))
          .filter(tag => tag.dataset.route === '/about/');
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.template).to.be.equal('test');
        expect(dataset.key).to.be.equal('/_routes/about/index.html');
      });

      it('should have the expected properties for each <greenwood-route> tag for the home page', function() {
        const aboutRouteTag = Array
          .from(dom.window.document.querySelectorAll('body > greenwood-route'))
          .filter(tag => tag.dataset.route === '/');
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.template).to.be.equal('page');
        expect(dataset.key).to.be.equal('/_routes/index.html');
      });

      // tests to make sure we filter out 404 page from _route partials
      it('should have the expected top level HTML files (index.html, 404.html) in the output', function() {
        // const aboutPartial = fs.readFileSync(path.join(this.context.publicDir, '*.html'), 'utf-8');
        // const aboutRouterOutlet = aboutDom.window.document.querySelectorAll('body > router-outlet')[0];

        expect(pages.length).to.equal(2);
      });

      it('should have the expected number of _route partials in the output directory for each page', function() {
        expect(partials.length).to.be.equal(3);
      });

      it('should have the expected partial output to match the contents of the home page in the <router-outlet> tag in the <body>', function() {
        const aboutPartial = fs.readFileSync(path.join(this.context.publicDir, '_routes/about/index.html'), 'utf-8');
        const aboutRouterOutlet = aboutDom.window.document.querySelectorAll('body > router-outlet')[0];

        expect(aboutRouterOutlet.innerHTML).to.contain(aboutPartial);
      });

      it('should have the expected partial output to match the contents of the about page in the <router-outlet> tag in the <body>', function() {
        const homePartial = fs.readFileSync(path.join(this.context.publicDir, '_routes/index.html'), 'utf-8');
        const homeRouterOutlet = dom.window.document.querySelectorAll('body > router-outlet')[0];
        
        expect(homeRouterOutlet.innerHTML).to.contain(homePartial);
      });
      
    });

    // https://github.com/ProjectEvergreen/greenwood/pull/743
    describe('MPA (Multi Page Application) Regex <body> Test', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'regex-test/index.html'));
      });
      
      it('should not have duplicate <app-footer> custom elements', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
      });

      it('should not have duplicate <app-header> custom elements', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should only have three cards', function() {
        const cards = dom.window.document.querySelectorAll('body app-card');

        expect(cards.length).to.be.equal(3);
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});