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
 *   proxy: {
 *     '/api': 'https://www.analogstudios.net'
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 *
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const { getDependencyFiles, getSetupFiles } = require('../../../../../test/utils');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const litElementLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lib/*.js`,
        `${outputPath}/node_modules/lit-element/lib/`
      );
      const litElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lit-element.js`,
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/package.json`,
        `${outputPath}/node_modules/lit-element/`
      );
      const litHtml = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lit-html.js`,
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`,
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lib/*.js`,
        `${outputPath}/node_modules/lit-html/lib/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...litElementPackageJson,
        ...litElement,
        ...litElementLibs,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlLibs
      ]);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific HTML behaviors', function() {
      let response = '';
      let dom;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;

            dom = new JSDOM(body);
            resolve(response);
          });
        });
      });

      it('should return an import map shim <script> in the <head> of the document', function(done) {
        const importMapTag = dom.window.document.querySelectorAll('head > script[type="importmap-shim"]')[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap['lit-html']).to.equal('/node_modules/lit-html/lit-html.js');
        expect(importMap['lit-element']).to.equal('/node_modules/lit-element/lit-element.js');
        expect(importMap['lit-html/lit-html.js']).to.equal('/node_modules/lit-html/lit-html.js');
        expect(importMap['lit-html/lib/shady-render.js']).to.equal('/node_modules/lit-html/lib/shady-render.js');

        done();
      });

      it('should return an import map in the <head> of the document', function(done) {
        const importMapShimTag = dom.window.document.querySelectorAll('head > script[defer]')[0];
        const shimSrc = importMapShimTag.getAttribute('src');

        expect(shimSrc).to.equal('/node_modules/es-module-shims/dist/es-module-shims.js');

        done();
      });

      it('should add a <script> tag for livereload', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script[src]'));
        const livereloadScript = scriptTags.filter((tag) => {
          return tag.getAttribute('src').indexOf('livereload.js') >= 0;
        });

        expect(livereloadScript.length).to.equal(1);

        done();
      });   
    });

    describe('Develop command specific JavaScript behaviors', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/components/header.js`, (err, res) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });
    });

    describe('Develop command specific CSS behaviors', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/styles/main.css`, (err, res) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;

            resolve(response);
          });
        });
      });

      it('should eturn a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/css');
        done();
      });
    });

    describe('Develop command specific node modules resolution behavior', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/lit-html/lit-html.js`, (err, res) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });
    });

    // proxies to analogstudios.net/api/events
    describe('Develop command with dev proxy', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/api/events`, (err, res) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('application/json');
        done();
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