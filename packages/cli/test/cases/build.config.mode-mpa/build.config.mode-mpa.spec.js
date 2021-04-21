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
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Mode';
  const greenwoodRouterLibs = (await glob(`${process.cwd()}/packages/cli/src/lib/router.js`)).map((lib) => {
    return {
      dir: 'node_modules/@greenwood/cli/src/lib/',
      name: path.basename(lib)
    };
  });
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    describe('MPA (Multi Page Application)', function() {
      let dom;
      let aboutDom;
      let partials;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        aboutDom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about/index.html'));
        partials = await glob(`${this.context.publicDir}/_routes/**/*.html`);
      });
      
      it('should have one <script> tag in the <head> for the router', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[type]');

        expect(scriptTags.length).to.be.equal(1);
        expect(scriptTags[0].href).to.be.contain(/router.*.js/);
        expect(scriptTags[0].type).to.be.equal('module');
      });

      it('should have one router.js file in the output directory', function() {
        const routerJsFiles = fs.readdirSync(this.context.publicDir).filter(file => file.indexOf('router') === 0);

        expect(routerJsFiles.length).to.be.equal(1);
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

      it('should have two <greenwood-route> tags in the <body> for the content', function() {
        const routeTags = dom.window.document.querySelectorAll('body > greenwood-route');

        expect(routeTags.length).to.be.equal(2);
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

      it('should have the expected number of _route partials in the output directory for each page', function() {
        expect(partials.length).to.be.equal(2);
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

  });

  after(function() {
    runner.teardown();
  });

});