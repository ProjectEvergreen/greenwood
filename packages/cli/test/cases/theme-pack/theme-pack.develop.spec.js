/*
 * Use Case
 * A theme pack _author_ creating a theme pack and using Greenwood for development and testing
 * following the guide published on the Greenwood website. (https://www.greenwoodjs.io/guides/theme-packs/)
 * 
 * User Result
 * Should correctly validate the develop and build / serve commands work correctly using tge expected templates 
 * being resolved correctly per the known work around needs as documented in the FAQ and tracked in a discussion.
 * https://github.com/ProjectEvergreen/greenwood/discussions/682
 * 
 * User Command
 * greenwood develop
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Plugin Author Workspace
 * src/
 *   components/
 *     header.js
 *   layouts/
 *     blog-post.html
 *   pages/
 *     index.md
 *   styles/
 *     theme.css
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const packageJson = require('./package.json');
const path = require('path');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Developement environment for a Theme Pack';
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
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

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

      it('should have expected text from from a mock package layouts/blog-post.html in the users workspace', function(done) {
        const pageTemplateHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageTemplateHeading.textContent).to.be.equal('This is the blog post template called from the layouts directory.');
        done();
      });

      it('should have expected text from user workspace pages/index.md', function(done) {
        const heading = dom.window.document.querySelectorAll('body h2')[0];
        const paragraph = dom.window.document.querySelectorAll('body p')[0];

        expect(heading.textContent).to.be.equal('Title of blog post');
        expect(paragraph.textContent).to.be.equal('Lorum Ipsum, this is a test.');
        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving theme.css for local development', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/${packageJson.name}/dist/styles/theme.css`
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
        expect(response.body).to.equal(':root {\n  --color-primary: #135;\n  --color-secondary: #74b238;\n  --font-family: \'Optima\', sans-serif;\n}');

        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving header.js for local development', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/${packageJson.name}/dist/components/header.js`
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
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should correctly return JavaScript from the developers local files', function(done) {
        expect(response.body).to.contain('customElements.define(\'x-header\', HeaderComponent);');

        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });

});

