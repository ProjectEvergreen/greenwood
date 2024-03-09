/*
 * Use Case
 * Run Greenwood with an SSR route.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a server rendered application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   port: 8181
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     card.js
 *     counter.js
 *   images/
 *     logo.svg
 *   pages/
 *     about.md
 *     artists.js
 *     index.js
 *     post.js
 *     users.js
 *   templates/
 *     app.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8181';
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'serve', { async: true });
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Serve command with HTML route response for the home page using "get" functions', function() {
      let response;
      let dom;

      before(async function() {
        response = await fetch(`${hostname}/`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should have the expected output for the page', function() {
        const headings = dom.window.document.querySelectorAll('body > h1');

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('Hello from the server rendered home page!');
      });

      it('should have the expected bundled SSR output for the page', async function() {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
          .filter(file => file.indexOf('index.js') >= 0);

        expect(scriptFiles.length).to.equal(2);
      });
    });

    describe('Serve command with HTML route response for artists page using "get" functions', function() {
      let response;
      let dom;
      let artistsPageGraphData;
      let body;

      before(async function() {
        response = await fetch(`${hostname}/artists/`);
        body = await response.clone().text();
        const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, 'public/graph.json'), 'utf-8'));

        artistsPageGraphData = graph.find(page => page.route === '/artists/');
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      // this is limited by the fact SSR routes have to write to the fs in order to bundle a page on the fly
      it('should not emit a static file', function(done) {
        const ssrPageOutput = fs.existsSync(path.join(outputPath, 'public/artists/index.html'));

        expect(ssrPageOutput).to.be.false;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have one style tags', function() {
        const styles = dom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      it('should have the expected number of <script> tags in the <head>', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));

        expect(scripts.length).to.equal(4);
      });

      it('should have the expected <app-header> tag from the app template in the <head>', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(script => script.src && script.src.startsWith('/header.'));

        expect(scripts.length).to.equal(1);
      });

      it('should have expected SSR content from the non module script tag', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(tag => !tag.getAttribute('data-gwd'))
          .filter(tag => !tag.getAttribute('type'));

        expect(scripts.length).to.equal(2);
        expect(scripts[1].textContent).to.contain('console.log');
      });

      it('should have the expected number of table rows of content', function() {
        const rows = dom.window.document.querySelectorAll('body > table tr');

        expect(rows.length).to.equal(11);
      });

      it('should have the expected <title> content in the <head>', function() {
        const title = dom.window.document.querySelectorAll('head > title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('/artists/');
      });

      it('should have custom metadata in the <head>', function() {
        const metaDescription = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter((tag) => tag.getAttribute('name') === 'description');

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute('content')).to.equal('/artists/ (this was generated server side!!!)');
      });

      it('should be a part of graph.json', function() {
        expect(artistsPageGraphData).to.not.be.undefined;
      });

      it('should have the expected menu and index values in the graph', function() {
        expect(artistsPageGraphData.label).to.equal('Artists');
        expect(artistsPageGraphData.data.menu).to.equal('navigation');
        expect(artistsPageGraphData.data.index).to.equal(7);
      });

      it('should have expected custom data values in its graph data', function() {
        expect(artistsPageGraphData.data.author).to.equal('Project Evergreen');
        expect(artistsPageGraphData.data.date).to.equal('01-01-2021');
      });

      it('should append the expected <script> tag for a frontmatter import <x-counter> component', function() {
        const counterScript = Array.from(dom.window.document.querySelectorAll('head > script[src]'))
          .filter((tag) => tag.getAttribute('src').startsWith('/counter.'));

        expect(counterScript.length).to.equal(1);
      });

      it('should append the expected graph import scripts for the page', function() {
        const { imports } = artistsPageGraphData;

        expect(imports.length).to.equal(1);
        expect(imports[0]).to.equal('/components/counter.js');
      });

      it('should append the expected graph resource scripts for the page from a template', function() {
        const { resources } = artistsPageGraphData;

        expect(resources.length).to.equal(6);
        expect(resources.find(resource => resource.endsWith('/header.js'))).to.not.be.undefined;
      });

      it('should have the expected bundled SSR output for the page', async function() {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
          .filter(file => file.indexOf('artists.js') >= 0);

        expect(scriptFiles.length).to.equal(2);
      });
    });

    describe('Prerender an HTML route response for users page exporting an HTMLElement as default export', function() {
      let response;
      let dom;

      before(async function() {
        response = await fetch(`${hostname}/users/`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected <h1> text in the <body>', function() {
        const heading = dom.window.document.querySelectorAll('body > h1');
        const userLength = parseInt(heading[0].querySelector('span').textContent, 10);

        expect(heading.length).to.be.equal(1);
        expect(heading[0].textContent).to.contain('List of Users:');
        expect(userLength).to.greaterThan(0);
      });

      it('should have the expected number of <wc-card> tags in the <head>', function() {
        const cards = dom.window.document.querySelectorAll('body > wc-card template[shadowrootmode="open"]');

        expect(cards.length).to.be.greaterThan(0);
      });

      it('should have the expected bundled SSR output for the page', async function() {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
          .filter(file => file.indexOf('users.js') >= 0);

        expect(scriptFiles.length).to.equal(2);
      });
    });

    describe('Bundled image using new URL and import.meta.url', function() {
      const bundledName = 'assets/logo-619de195.svg';
      let response = {};
      let body;
      let usersResponse = {};
      let usersBody;

      before(async function() {
        response = await fetch(`${hostname}/${bundledName}`);
        body = await response.clone().text();

        usersResponse = await fetch(`${hostname}/users/`);
        usersBody = await usersResponse.clone().text();
      });

      it('should return a 200 status for the image', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the expected content-type for the image', function(done) {
        expect(response.headers.get('content-type')).to.equal('image/svg+xml');
        done();
      });

      it('should return the expected body for the image', function(done) {
        expect(body.startsWith('<svg')).to.equal(true);
        done();
      });

      it('should return the expected bundled image name inside the bundled page route', function(done) {
        expect(usersBody.indexOf(bundledName) >= 0).to.equal(true);
        done();
      });
    });

    describe('Prerender an HTML route response for post page exporting an HTMLElement as default export and data loading', function() {
      const postId = 1;
      let dom;
      let response;

      before(async function() {
        response = await fetch(`${hostname}/post/?id=${postId}`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected postId as an <h1> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h1');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal(`Fetched Post ID: ${postId}`);
      });

      it('should have the expected title as an <h2> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h2');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.not.be.undefined;
      });

      it('should have the expected body as a <p> tag in the body', function() {
        const paragraph = dom.window.document.querySelectorAll('body > p');

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.not.be.undefined;
      });
    });

    describe('Serve command with 404 not found behavior', function() {
      let response = {};

      before(async function() {
        response = await fetch(`${hostname}/foo`);
      });

      it('should return a 404 status', function(done) {
        expect(response.status).to.equal(404);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});