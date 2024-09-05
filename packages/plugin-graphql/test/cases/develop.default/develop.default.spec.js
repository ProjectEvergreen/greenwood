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
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import { runSmokeTest } from '../../../../../test/smoke-test.js';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'GraphQL plugin for resolving client facing files';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command import map for GraphQL', function() {
      let response = {};
      let data;
      let dom;

      before(async function() {
        response = await fetch(`${hostname}:${port}`);
        data = await response.text();
        dom = new JSDOM(data);
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/html');
      });

      it('should return an import map shim <script> in the <head> of the document', function(done) {
        const importMapTag = dom.window.document.querySelectorAll('head > script[type="importmap"]')[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap['@greenwood/plugin-graphql/src/core/client.js']).to.equal('/node_modules/@greenwood/plugin-graphql/src/core/client.js');
        expect(importMap['@greenwood/plugin-graphql/src/core/common.js']).to.equal('/node_modules/@greenwood/plugin-graphql/src/core/common.js');
        expect(importMap['@greenwood/plugin-graphql/src/queries/children.gql']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/children.gql');
        expect(importMap['@greenwood/plugin-graphql/src/queries/config.gql']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/config.gql');
        expect(importMap['@greenwood/plugin-graphql/src/queries/graph.gql']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql');
        expect(importMap['@greenwood/plugin-graphql/src/queries/menu.gql']).to.equal('/node_modules/@greenwood/plugin-graphql/src/queries/menu.gql');

        done();
      });
    });

    describe('Develop command specific client node_modules resolution', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}:${port}/node_modules/@greenwood/plugin-graphql/src/core/client.js`);
        data = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/javascript');
      });

      it('should return an ECMASCript module', function() {
        expect(data).to.contain('export default client;');
      });
    });

    describe('Develop command specific .gql behaviors', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}:${port}/data/queries/gallery.gql`);
        data = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/javascript');
      });

      it('should return an ECMASCript module', function() {
        expect(data.trim().indexOf('export default')).to.equal(0);
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