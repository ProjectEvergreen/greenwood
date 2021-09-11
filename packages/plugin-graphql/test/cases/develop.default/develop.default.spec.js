/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and process GraphQL (.gql) files as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * GraphQL Plugin
 *
 * User Workspace
 * src/data
 *   queries/
 *     gallery.gql
 *
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'GraphQL plugin for resolving client facing files';
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
        }, 3000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command import map for GraphQL', function() {
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return an import map shim <script> in the <head> of the document', function(done) {
        const importMapTag = dom.window.document.querySelectorAll('head > script[type="importmap-shim"]')[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap['@greenwood/plugin-graphql/core/client']).to.equal('/node_modules/@greenwood/plugin-graphql/src/core/client.js');
        expect(importMap['@greenwood/plugin-graphql/core/common']).to.equal('/node_modules/@greenwood/plugin-graphql/src/core/common.client.js');
        expect(importMap['@greenwood/plugin-graphql/queries/children']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/children.gql');
        expect(importMap['@greenwood/plugin-graphql/queries/config']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/config.gql');
        expect(importMap['@greenwood/plugin-graphql/queries/graph']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql');
        expect(importMap['@greenwood/plugin-graphql/queries/menu']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/menu.gql');

        done();
      });
    });

    describe('Develop command specific client node_modules resolution', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/@greenwood/plugin-graphql/src/core/client.js`
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return an ECMASCript module', function(done) {
        expect(response.body).to.contain('export default client;');
        done();
      });
    });

    describe('Develop command specific .gql behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/data/queries/gallery.gql`
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return an ECMASCript module', function(done) {
        expect(response.body.trim().indexOf('export default')).to.equal(0);
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