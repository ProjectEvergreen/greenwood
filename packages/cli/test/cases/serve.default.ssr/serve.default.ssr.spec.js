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
 *   pages/
 *     about.md
 *     artists.js
 *     index.js
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
import request from 'request';
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

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);

    let response = {};
    let artistsPageDom;
    let homePageDom;
    let usersPageDom;
    let artistsPageGraphData;

    before(async function() {
      return new Promise((resolve, reject) => {
        request.get(`${hostname}/`, (err, res, body) => {
          if (err) {
            reject();
          }

          homePageDom = new JSDOM(body);

          resolve();
        });
      });
    });

    before(async function() {
      const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, 'public/graph.json'), 'utf-8'));

      artistsPageGraphData = graph.find(page => page.route === '/artists/');

      return new Promise((resolve, reject) => {
        request.get(`${hostname}/artists/`, (err, res, body) => {
          if (err) {
            reject();
          }

          response = res;
          response.body = body;

          artistsPageDom = new JSDOM(body);

          resolve();
        });
      });
    });

    before(async function() {
      return new Promise((resolve, reject) => {
        request.get(`${hostname}/users/`, (err, res, body) => {
          if (err) {
            reject();
          }
          usersPageDom = new JSDOM(body);

          resolve();
        });
      });
    });

    describe('Serve command with HTML route response for the home page using "get" functions', function() {
      it('should have the expected output for the page', function() {
        const headings = homePageDom.window.document.querySelectorAll('body > h1');

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

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(response.body).to.not.be.undefined;
        done();
      });

      // this is limited by the fact SSR routes have to write to the fs in order to bundle a page on the fly
      it('should not emit a static file', function(done) {
        const ssrPageOutput = fs.existsSync(path.join(outputPath, 'public/artists/index.html'));

        expect(ssrPageOutput).to.be.false;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(artistsPageDom).to.not.be.undefined;
        done();
      });

      it('should have one style tags', function() {
        const styles = artistsPageDom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      it('should have the expected number of <script> tags in the <head>', function() {
        const scripts = artistsPageDom.window.document.querySelectorAll('head > script');

        expect(scripts.length).to.equal(3);
      });

      it('should have the expected <app-header> tag from the app template in the <head>', function() {
        const scripts = Array.from(artistsPageDom.window.document.querySelectorAll('head > script'))
          .filter(script => script.src && script.src.startsWith('/header.'));

        expect(scripts.length).to.equal(1);
      });

      it('should have expected SSR content from the non module script tag', function() {
        const scripts = Array.from(artistsPageDom.window.document.querySelectorAll('head > script'))
          .filter(tag => !tag.getAttribute('type'));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].textContent).to.contain('console.log');
      });

      it('should have the expected number of table rows of content', function() {
        const rows = artistsPageDom.window.document.querySelectorAll('body > table tr');

        expect(rows.length).to.equal(11);
      });

      it('should have the expected <title> content in the <head>', function() {
        const title = artistsPageDom.window.document.querySelectorAll('head > title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('/artists/');
      });

      it('should have custom metadata in the <head>', function() {
        const metaDescription = Array.from(artistsPageDom.window.document.querySelectorAll('head > meta'))
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
        const counterScript = Array.from(artistsPageDom.window.document.querySelectorAll('head > script[src]'))
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

        expect(resources.length).to.equal(4);
        expect(resources.find(resource => resource.endsWith('/header.js'))).to.not.be.undefined;
      });

      it('should have the expected bundled SSR output for the page', async function() {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
          .filter(file => file.indexOf('artists.js') >= 0);

        expect(scriptFiles.length).to.equal(2);
      });
    });

    describe('Prerender an HTML route response for users page exporting an HTMLElement as default export', function() {
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

      it('should have the expected number of <wc-card> tags in the <head>', function() {
        const cards = usersPageDom.window.document.querySelectorAll('body > wc-card template[shadowroot="open"]');

        expect(cards.length).to.be.greaterThan(0);
      });

      xit('should have a bundled <script> for the card component', function() {
        const cardScript = Array.from(usersPageDom.window.document.querySelectorAll('head > script[type]'))
          .filter(script => (/card.*[a-z0-9].js/).test(script.src));

        expect(cardScript.length).to.be.equal(1);
        expect(cardScript[0].type).to.be.equal('module');
      });

      it('should have the expected bundled SSR output for the page', async function() {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
          .filter(file => file.indexOf('users.js') >= 0);

        expect(scriptFiles.length).to.equal(2);
      });
    });

    describe('Serve command with 404 not found behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/foo`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 404 status', function(done) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});