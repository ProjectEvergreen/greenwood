/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
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
import { getSetupFiles } from '../../../../../test/utils.js';
import request from 'request';
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
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}${basePath}/`,
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
    });

    describe('Develop command specific JavaScript behaviors for user authored custom element', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}${basePath}/components/card.js`, (err, res, body) => {
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
        expect(response.body).to.contain('class Card extends HTMLElement');
        done();
      });
    });

    describe('Develop command specific CSS behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}${basePath}/styles/main.css`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should eturn a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('color: blue;');
        done();
      });
    });

    describe('Develop command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {

          request.get(`${hostname}:${port}${basePath}/assets/logo.${ext}`, (err, res, body) => {
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
    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    // describe('Develop command with dev proxy', function() {
    //   let response = {};

    //   before(async function() {
    //     return new Promise((resolve, reject) => {
    //       request.get(`${hostname}:${port}/posts?id=7`, (err, res, body) => {
    //         if (err) {
    //           reject();
    //         }

    //         response = res;
    //         response.body = JSON.parse(body);

    //         resolve();
    //       });
    //     });
    //   });

    //   it('should return a 200 status', function(done) {
    //     expect(response.statusCode).to.equal(200);
    //     done();
    //   });

    //   it('should return the correct content type', function(done) {
    //     expect(response.headers['content-type']).to.contain('application/json');
    //     done();
    //   });

    //   it('should return the correct response body', function(done) {
    //     expect(response.body).to.have.lengthOf(1);
    //     done();
    //   });
    // });

    // TODO
    // describe('Develop command with API specific behaviors', function() {
    //   const name = 'Greenwood';
    //   let response = {};
    //   let data = {};

    //   before(async function() {
    //     response = await fetch(`${hostname}:${port}/api/greeting?name=${name}`);

    //     data = await response.json();
    //   });

    //   it('should return a 200 status', function(done) {
    //     expect(response.ok).to.equal(true);
    //     expect(response.status).to.equal(200);
    //     done();
    //   });

    //   it('should return the correct content type', function(done) {
    //     expect(response.headers.get('content-type')).to.equal('application/json; charset=utf-8');
    //     done();
    //   });

    //   it('should return the correct response body', function(done) {
    //     expect(data.message).to.equal(`Hello ${name}!!!`);
    //     done();
    //   });
    // });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'node_modules')
    ]);
  });
});