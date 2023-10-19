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
 * {
 *   devServer: {
 *    proxy: {
 *      '/post': 'https://jsonplaceholder.typicode.com'
 *    }
 *   },
 *   port: 8181
 * }
 *
 * User Workspace
 * src/
 *   api/
 *     greeting.js
 *   assets/
 *     data.json
 *     favicon.ico
 *     logo.png
 *     router.js.map
 *     song-sample.mp3
 *     source-sans-pro.woff
 *     splash-clip.mp4
 *     webcomponents.svg
 */
import chai from 'chai';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost:8181';
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

    runSmokeTest(['serve'], LABEL);

    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    describe('Serve command with dev proxy', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}/posts?id=7`);
        data = await response.json();
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('application/json; charset=utf-8');
      });

      it('should return the correct response body', function() {
        expect(data).to.have.lengthOf(1);
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1059
    describe('Serve command with dev proxy with an /api prefix', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/posts?id=7`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = JSON.parse(body);

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(JSON.stringify(response.body)).to.equal('{}');
        done();
      });
    });

    describe('Serve command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {

          request.get(`${hostname}/assets/logo.${ext}`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal(`image/${ext}`);
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('PNG');
        done();
      });
    });

    describe('Serve command with image (ico) specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/favicon.ico`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('image/x-icon');
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('\u0000');
        done();
      });
    });

    describe('Serve command with SVG specific behavior', function() {
      const ext = 'svg';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/webcomponents.${ext}`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal(`image/${ext}+xml`);
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.indexOf('<svg')).to.equal(0);
        done();
      });
    });

    describe('Serve command with font specific (.woff) behavior', function() {
      const ext = 'woff';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/source-sans-pro.woff?v=1`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal(`font/${ext}`);
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('wOFF');
        done();
      });
    });

    describe('Serve command with generic video container format (.mp4) behavior', function() {
      const ext = 'mp4';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `${hostname}/assets/splash-clip.mp4`
          }, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal(`video/${ext}`);
        done();
      });

      it('should return the correct content length', function(done) {
        expect(response.headers['content-length']).to.equal('2498461');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain(ext);
        done();
      });
    });

    describe('Serve command with audio format (.mp3) behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/song-sample.mp3`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('audio/mpeg');
        done();
      });

      it('should return the correct content length', function(done) {
        expect(response.headers['content-length']).to.equal('5425061');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('ID3');
        done();
      });
    });

    describe('Serve command with JSON specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/data.json`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = JSON.parse(body);

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.name).to.equal('Marvin');
        done();
      });
    });

    describe('Serve command with source map specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/assets/router.js.map`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('"sources":["../packages/cli/src/lib/router.js"]');
        done();
      });
    });

    describe('Serve command with 404 not found behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/foo.png`, (err, res, body) => {
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

    describe('Fetching graph.json client side', function() {
      let response;
      let graph;

      before(async function() {
        response = await fetch(`${hostname}/graph.json`);
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
        expect(graph.length).to.equal(2);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});