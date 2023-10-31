/*
 * Use Case
 * Run Greenwood serve command with no basePath configuration set (and staticRouter).
 *
 * User Result
 * Should start the development server and render a the Greenwood application.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   basePath: '/my-path',
 *   devServer: {
 *     proxy: {
 *       '/posts': 'https://jsonplaceholder.typicode.com'
 *     }
 *   }
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
 *     index.html
 *     users.js
 *   styles/
 *     main.css
 * package.json
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Base Path Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const port = 1984;
  const basePath = '/my-path';
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath)
      ]);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    describe('Develop command specific HTML behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}:${port}${basePath}/`, {
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

      it('should have the expected heading tag in the DOM', function(done) {
        const headings = Array.from(dom.window.document.querySelectorAll('body > h1'));

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('Hello World');

        done();
      });

      it('should have the expected <app-card> tag in the DOM', function(done) {
        const cards = Array.from(dom.window.document.querySelectorAll('body > app-card'));

        expect(cards.length).to.equal(1);

        done();
      });
    });

    describe('Develop command specific JavaScript behaviors for user authored custom element', function() {
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}:${port}${basePath}/components/card.js`);
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
        expect(body).to.contain('class Card extends HTMLElement');
        done();
      });
    });

    describe('Develop command specific CSS behaviors', function() {
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}:${port}${basePath}/styles/main.css`);
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
        expect(body).to.contain('color: blue;');
        done();
      });
    });

    describe('Develop command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};
      let body = '';

      before(async function() {
        response = await fetch(`${hostname}:${port}${basePath}/assets/logo.${ext}`);
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

    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    describe('Develop command with dev proxy', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}:${port}${basePath}/posts?id=7`);
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
        response = await fetch(`${hostname}:${port}${basePath}/api/greeting?name=${name}`);

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
        const response = await fetch(`${hostname}:${port}${basePath}/users/`);
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
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'node_modules')
    ]);
  });
});