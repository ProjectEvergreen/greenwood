/*
 * Use Case
 * Run Greenwood serve command with no basePath configuration set (and staticRouter).
 *
 * User Result
 * Should start the production server and render a the Greenwood application.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * devServer: {
 *   basePath: '/my-path',
 *   staticRouter: true
 * }
 *
 * User Workspace
 * src/
 *   api/
 *     greeting.js
 *   assets/
 *     logo.png
 *   components/
 *     card.js
 *   pages/
 *     about.md
 *     index.html
 *     users.js
 *   styles/
 *     main.css
 * package.json
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles, getDependencyFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Base Path Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const publicPath = path.join(outputPath, 'public/');
  const hostname = 'http://127.0.0.1:8080';
  const basePath = '/my-path';
  const jsHash = '4bcc801e';
  const cssHash = '1454013616';
  let runner;

  before(function() {
    this.context = {
      hostname
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

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    describe('Serve command specific HTML behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}${basePath}/`, {
          headers: {
            accept: 'text/html'
          }
        });

        dom = new JSDOM(await response.clone().text());
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should add a <script> tag for tracking basePath configuration', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script'));
        const basePathScript = scriptTags.filter((tag) => {
          return tag.getAttribute('data-gwd') === 'base-path';
        });

        expect(basePathScript.length).to.equal(1);
        expect(basePathScript[0].textContent).to.contain(`globalThis.__GWD_BASE_PATH__="${basePath}"`);
        done();
      });

      it('should have the expected heading tag in the DOM', function(done) {
        const headings = Array.from(dom.window.document.querySelectorAll('body h1'));

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('Hello World');

        done();
      });

      it('should have the expected <app-card> tag in the DOM', function(done) {
        const cards = Array.from(dom.window.document.querySelectorAll('body app-card'));

        expect(cards.length).to.equal(1);

        done();
      });

      it('should have the correct script link preload tag path in the DOM', function(done) {
        const links = Array
          .from(dom.window.document.querySelectorAll('head > link'))
          .filter(link => link.getAttribute('as') === 'script');

        // TODO for some reason there is an extra <link> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(links.length).to.equal(2);
        expect(links[1].getAttribute('href')).to.equal(`${basePath}/card.${jsHash}.js`);

        done();
      });

      it('should have the correct script tag path in the DOM for the card component', function(done) {
        const scripts = Array
          .from(dom.window.document.querySelectorAll('head script'))
          .filter(script => script.getAttribute('type') === 'module');

        // TODO for some reason there is an extra <script> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(scripts.length).to.equal(2);
        expect(scripts[0].getAttribute('src')).to.equal(`${basePath}/card.${jsHash}.js`);

        done();
      });

      it('should have the correct style preload tag path in the DOM', function(done) {
        const links = Array
          .from(dom.window.document.querySelectorAll('head link'))
          .filter(link => link.getAttribute('as') === 'style');

        expect(links.length).to.equal(1);
        expect(links[0].getAttribute('href')).to.equal(`${basePath}/styles/main.${cssHash}.css`);

        done();
      });

      it('should have the correct link tag for the stylesheet in the DOM', function(done) {
        const styles = Array
          .from(dom.window.document.querySelectorAll('head > link'))
          .filter(link => link.getAttribute('rel') === 'stylesheet');

        expect(styles.length).to.equal(1);
        expect(styles[0].getAttribute('href')).to.equal(`${basePath}/styles/main.${cssHash}.css`);

        done();
      });
    });

    describe('Serve command specific JavaScript behaviors for user authored custom element', function() {
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}${basePath}/card.${jsHash}.js`);
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(body).to.contain('class t extends HTMLElement');
        done();
      });
    });

    describe('Serve command specific CSS behaviors', function() {
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}${basePath}/styles/main.${cssHash}.css`);
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/css');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(body).to.contain('*{color:blue}');
        done();
      });
    });

    describe('Serve command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}${basePath}/assets/logo.${ext}`);
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain(`image/${ext}`);
        done();
      });

      it('should return binary data', function(done) {
        expect(body).to.contain('PNG');
        done();
      });
    });

    describe('Static content routes', function() {
      let dom;
      let aboutDom;
      let pages;
      let partials;
      let routerFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(publicPath, 'index.html'));
        aboutDom = await JSDOM.fromFile(path.resolve(publicPath, 'about/index.html'));
        pages = await glob(`${publicPath}/*.html`);
        partials = await glob(`${publicPath}/_routes/**/*.html`);
        routerFiles = await glob(`${publicPath}/router.*.js`);
      });

      it('should have one <script> tag in the <head> for the router', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[type]');

        // TODO for some reason there is an extra <script> tag in the head, should only be 1
        // https://github.com/ProjectEvergreen/greenwood/issues/1051
        expect(scriptTags.length).to.be.equal(2);
        expect(scriptTags[0].href).to.contain(/router.*.js/);
        expect(scriptTags[0].type).to.be.equal('module');
      });

      it('should have one router.js file in the output directory', function() {
        expect(routerFiles.length).to.be.equal(1);
      });

      it('should have one expected inline <script> tag in the <head> for router global variables', function() {
        const routerScriptTags = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(tag => tag.getAttribute('data-gwd') === 'static-router');

        expect(routerScriptTags.length).to.be.equal(1);
        expect(routerScriptTags[0].textContent.replace(/ /g, '').replace(/\n/g, '')).to.contain(`window.__greenwood=window.__greenwood||{};window.__greenwood.currentTemplate="${basePath}/"`);
      });

      it('should have one <router-outlet> tag in the <body> for the content', function() {
        const routerOutlets = dom.window.document.querySelectorAll('body > router-outlet');

        expect(routerOutlets.length).to.be.equal(1);
      });

      it('should have expected <greenwood-route> tags in the <body> for each page', function() {
        const routeTags = dom.window.document.querySelectorAll('body > greenwood-route');

        expect(routeTags.length).to.be.equal(2);
      });

      it('should have the expected properties for each <greenwood-route> tag for the about page', function() {
        const aboutRouteTag = Array
          .from(dom.window.document.querySelectorAll('body > greenwood-route'))
          .filter(tag => tag.dataset.route === `${basePath}/about/`);
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.template).to.be.equal('test');
        expect(dataset.key).to.be.equal(`${basePath}/_routes/about/index.html`);
      });

      it('should have the expected properties for each <greenwood-route> tag for the home page', function() {
        const aboutRouteTag = Array
          .from(dom.window.document.querySelectorAll('body > greenwood-route'))
          .filter(tag => tag.dataset.route === `${basePath}/`);
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.template).to.be.equal(`${basePath}/`);
        expect(dataset.key).to.be.equal(`${basePath}/_routes/index.html`);
      });

      // tests to make sure we filter out 404 page from _route partials
      it('should have the expected top level HTML files (index.html, 404.html) in the output', function() {
        expect(pages.length).to.equal(2);
      });

      it('should have the expected number of _route partials in the output directory for each page', function() {
        expect(partials.length).to.be.equal(3);
      });

      it('should have the expected partial output to match the contents of the home page in the <router-outlet> tag in the <body>', function() {
        const aboutPartial = fs.readFileSync(path.join(publicPath, '_routes/about/index.html'), 'utf-8');
        const aboutRouterOutlet = aboutDom.window.document.querySelectorAll('body > router-outlet')[0];

        expect(aboutRouterOutlet.innerHTML).to.contain(aboutPartial);
      });

      it('should have the expected partial output to match the contents of the about page in the <router-outlet> tag in the <body>', function() {
        const homePartial = fs.readFileSync(path.join(publicPath, '_routes/index.html'), 'utf-8');
        const homeRouterOutlet = dom.window.document.querySelectorAll('body > router-outlet')[0];

        expect(homeRouterOutlet.innerHTML).to.contain(homePartial);
      });

    });

    describe('Develop command with dev proxy', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}${basePath}/posts?id=7`);
        data = await response.clone().json();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(data).to.have.lengthOf(1);
        done();
      });
    });

    describe('Develop command with API specific behaviors', function() {
      const name = 'Greenwood';
      let response = {};
      let data = {};

      before(async function() {
        response = await fetch(`${hostname}${basePath}/api/greeting?name=${name}`);

        data = await response.json();
      });

      it('should return a 200 status', function(done) {
        expect(response.ok).to.equal(true);
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(data.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });

    describe('Prerender an HTML route response for users page exporting an HTMLElement as default export', function() {
      let usersPageDom;

      before(async function() {
        const response = await fetch(`${hostname}${basePath}/users/`);
        usersPageDom = new JSDOM(await response.text());
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(usersPageDom).to.not.be.undefined;
        done();
      });

      it('should have the expected <h1> text in the <body>', function() {
        const heading = usersPageDom.window.document.querySelectorAll('body > h1');
        const userLength = parseInt(heading[0].querySelector('span').textContent, 10);

        expect(heading.length).to.be.equal(1);
        expect(heading[0].textContent).to.contain('List of Users:');
        expect(userLength).to.greaterThan(0);
      });

      it('should have the expected number of <section> tags in the <body>', function() {
        const cards = usersPageDom.window.document.querySelectorAll('body > section');

        expect(cards.length).to.be.greaterThan(0);
      });
    });

    describe('Fetching graph.json client side', function() {
      let response;
      let graph;

      before(async function() {
        response = await fetch(`${hostname}${basePath}/graph.json`);
        graph = await response.clone().json();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('application/json');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should have the expected length for all content', function(done) {
        expect(graph.length).to.equal(4);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});