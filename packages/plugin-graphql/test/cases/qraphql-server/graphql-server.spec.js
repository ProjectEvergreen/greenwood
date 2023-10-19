/*
 * Use Case
 * Run Greenwood develop command with GraphQL plugin and test the GraphQL server.
 *
 * User Result
 * Should start in development and serve the GraphQL server.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * GraphQL Plugin
 *
 * User Workspace
 * Greenwood default (src/)
 */
import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'GraphQL Server';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'localhost';
  const port = 4000;
  let runner;

  before(function() {
    runner = new Runner(true);
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

    // ping the graphql server
    describe('Develop command with GraphQL server / playground running', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        response = await fetch(`http://${hostname}:${port}`, {
          headers: {
            accept: 'text/html'
          }
        });
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/html');
      });
    });

    // test a query call
    describe.only('Develop command with GraphQL server and running a query', function() {
      let response = {
        body: '',
        code: 0
      };
      let data;

      const body = {
        'operationName': null,
        'variables': {},
        'query': '{\n  config {\n    workspace\n  }\n}\n'
      };

      before(async function() {
        response = await fetch(`http://${hostname}:${port}/graphql`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'content-type': 'application/json'
          }
        });
        data = await response.text();
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('application/json; charset=utf-8');
      });

      it('should return the expected query response', function() {
        expect(data.config.workspace).to.equal(new URL('./src/', import.meta.url).href);
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'public')
    ]);
  });

});