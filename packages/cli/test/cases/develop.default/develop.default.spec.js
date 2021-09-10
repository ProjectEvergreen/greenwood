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
 *   assets/
 *     logo.png
 *     source-sans-pro.woff
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 * package.json
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
      const litHtmlSourceMap = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lit-html.js.map`,
        `${outputPath}/node_modules/lit-html/`
      );
      const simpleCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/simple.css`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const simpleCssPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/package.json`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const lionButtonLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/button/*.js`,
        `${outputPath}/node_modules/@lion/button/`
      );
      const lionButtonLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/button/package.json`,
        `${outputPath}/node_modules/@lion/button/`
      );
      const lionCoreTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/core/test-helpers/`
      );
      const lionCoreSrcLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/src/*.js`,
        `${outputPath}/node_modules/@lion/core/src/`
      );
      const lionCoreLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/*.js`,
        `${outputPath}/node_modules/@lion/core/`
      );
      const lionCoreLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/package.json`,
        `${outputPath}/node_modules/@lion/core/`
      );
      const lionCalendarLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/*.js`,
        `${outputPath}/node_modules/@lion/calendar/`
      );
      const lionCalendarLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/package.json`,
        `${outputPath}/node_modules/@lion/calendar/`
      );
      const lionCalendarTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/calendar/test-helpers/`
      );
      const lionLocalizeLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/*.js`,
        `${outputPath}/node_modules/@lion/localize/`
      );
      const lionLocalizeLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/package.json`,
        `${outputPath}/node_modules/@lion/localize/`
      );
      const lionLocalizeTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/localize/test-helpers/`
      );
      const lionLocalizeSrcLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/src/*.js`,
        `${outputPath}/node_modules/@lion/localize/src/`
      );
      const owcDepupLibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@open-wc/dedupe-mixin/package.json`,
        `${outputPath}/node_modules/@open-wc/dedupe-mixin/`
      );
      const owcScopedLibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@open-wc/scoped-elements/package.json`,
        `${outputPath}/node_modules/@open-wc/scoped-elements/`
      );
      const messageFormatLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@bundled-es-modules/message-format/MessageFormat.js`,
        `${outputPath}/node_modules/@bundled-es-modules/message-format/`
      );
      const messageFormatLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@bundled-es-modules/message-format/package.json`,
        `${outputPath}/node_modules/@bundled-es-modules/message-format/`
      );
      const singletonManagerLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/singleton-manager/index.js`,
        `${outputPath}/node_modules/singleton-manager/`
      );
      const singletonManagerLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/singleton-manager/package.json`,
        `${outputPath}/node_modules/singleton-manager/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...litElementPackageJson,
        ...litElement,
        ...litElementLibs,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlLibs,
        ...litHtmlSourceMap,
        ...simpleCss,
        ...simpleCssPackageJson,
        ...lionButtonLibs,
        ...lionButtonLibsPackageJson,
        ...lionCoreLibs,
        ...lionCoreTesterLibs,
        ...lionCoreLibsPackageJson,
        ...lionCoreSrcLibs,
        ...lionCalendarLibs,
        ...lionCalendarLibsPackageJson,
        ...lionCalendarTesterLibs,
        ...lionLocalizeLibs,
        ...lionLocalizeLibsPackageJson,
        ...lionLocalizeTesterLibs,
        ...lionLocalizeSrcLibs,
        ...owcDepupLibPackageJson,
        ...owcScopedLibPackageJson,
        ...messageFormatLibs,
        ...messageFormatLibsPackageJson,
        ...singletonManagerLibsPackageJson,
        ...singletonManagerLibs
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
      let response = {};
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

            response = res;
            
            dom = new JSDOM(body);
            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return an import map shim <script> in the <head> of the document', function(done) {
        const importMapTag = dom.window.document.querySelectorAll('head > script[type="importmap-shim"]')[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap['lit-html']).to.equal('/node_modules/lit-html/lit-html.js');
        expect(importMap['lit-element']).to.equal('/node_modules/lit-element/lit-element.js');
        expect(importMap['lit-html/lit-html.js']).to.equal('/node_modules/lit-html/lit-html.js');
        expect(importMap['lit-html/lib/shady-render.js']).to.equal('/node_modules/lit-html/lib/shady-render.js');

        // https://github.com/ProjectEvergreen/greenwood/issues/715
        // export maps with "flat" entries
        expect(importMap['@lion/button']).to.equal('/node_modules/@lion/button/index.js');
        expect(importMap['@lion/button/define']).to.equal('/node_modules/@lion/button/lion-button.js');

        // https://github.com/ProjectEvergreen/greenwood/issues/715
        // transient dependency import / exports
        expect(importMap['@bundled-es-modules/message-format/MessageFormat.js']).to.equal('/node_modules/@bundled-es-modules/message-format/MessageFormat.js');

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
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/components/header.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('class HeaderComponent extends HTMLElement');
        done();
      });
    });

    describe('Develop command specific CSS behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/styles/main.css`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/css');
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

          request.get(`${hostname}:${port}/assets/logo.${ext}`, (err, res, body) => {
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

    describe('Develop command with image (ico) specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/favicon.ico`, (err, res, body) => {
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

    describe('Develop command with SVG specific behavior', function() {
      const ext = 'svg';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/webcomponents.${ext}`, (err, res, body) => {
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

    describe('Develop command with font specific (.woff) behavior', function() {
      const ext = 'woff';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/source-sans-pro.woff`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal(ext);
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('wOFF');
        done();
      });
    });

    describe('Develop command with JSON specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/data.json`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.name).to.equal('Marvin');
        done();
      });
    });

    describe('Develop command with source map specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/lit-html/lit-html.js.map`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('"sources":["src/lit-html.ts"]');
        done();
      });
    });

    describe('Develop command specific node modules resolution behavior for JS with query string', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/lit-html/lit-html.js?type=xyz`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('Copyright (c) 2017 The Polymer Project Authors');
        done();
      });
    });

    describe('Develop command specific node modules resolution behavior for CSS with query string', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/simpledotcss/simple.css?xyz=123`
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

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/css');
        done();
      });

      it('should correctly return CSS from the developers local files', function(done) {
        expect(response.body).to.contain('/* Set the global variables for everything. Change these to use your own fonts/colours. */');
        done();
      });
    });

    // if things work correctly, this workspace file should never resolve to the equivalent node_modules file
    // https://github.com/ProjectEvergreen/greenwood/pull/687
    describe('Develop command specific workspace resolution when matching node_modules', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/lit-html.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.equal('console.debug(\'its just a prank bro!\');');
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/715
    describe('Develop command node_modules resolution for a transient dependency\'s own imports', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/@bundled-es-modules/message-format/MessageFormat.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('export default messageFormat;');
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/715
    // @lion/calendar/define -> /node_modules/@lion/calendar/lion-calendar.js
    describe('Develop command node_modules resolution for a flat export map entry from a dependency (not import or default)', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/@lion/calendar/lion-calendar.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('customElements.define(\'lion-calendar\', LionCalendar);');
        done();
      });
    });

    // need some better 404 handling here (promise reject handling for assets and routes)
    describe('Develop command with default 404 behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/abc.js`, (err, res, body) => {
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/plain');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('Not Found');
        done();
      });
    });

    // proxies to analogstudios.net/api/events vis greenwood.config.js
    // ideally should find something else to avoid using something "live" in our tests
    describe('Develop command with dev proxy', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/api/albums?artistId=2`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.have.lengthOf(1);
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