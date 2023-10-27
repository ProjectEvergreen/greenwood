/*
 * Use Case
 * Run Greenwood serve command with no config.
 *
 * User Result
 * Should start the production server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * devServer: {
 *   basePath: '/my-path'
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     logo.png
 *   components/
 *     card.js
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 * package.json
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Base Path Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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
      await runner.setup(outputPath, getSetupFiles(outputPath));
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
        return new Promise((resolve, reject) => {
          request.get({
            url: `${hostname}${basePath}/`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            dom = new JSDOM(body);
            
            resolve();
          });
        });
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

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

      it('should have the correct script link preload tag path in the DOM', function(done) {
        const links = Array
          .from(dom.window.document.querySelectorAll('head > link'))
          .filter(link => link.getAttribute('as') === 'script');

        expect(links.length).to.equal(1);
        expect(links[0].getAttribute('href')).to.equal(`${basePath}/card.${jsHash}.js`);

        done();
      });

      it('should have the correct script tag path in the DOM', function(done) {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script'));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].getAttribute('src')).to.equal(`${basePath}/card.${jsHash}.js`);

        done();
      });

      // <link rel="preload" href="/my-path/styles/main.1454013616.css" as="style" crossorigin="anonymous"></link>
      it('should have the correct style preload tag path in the DOM', function(done) {
        const links = Array
          .from(dom.window.document.querySelectorAll('head > link'))
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

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}${basePath}/card.${jsHash}.js`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('class t extends HTMLElement');
        done();
      });
    });

    describe('Serve command specific CSS behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}${basePath}/styles/main.${cssHash}.css`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('*{color:blue}');
        done();
      });
    });

    describe('Serve command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {

          request.get(`${hostname}${basePath}/assets/logo.${ext}`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain(`image/${ext}`);
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('PNG');
        done();
      });
    });

    // TODO
    // dev server proxy
    // API end[points
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});