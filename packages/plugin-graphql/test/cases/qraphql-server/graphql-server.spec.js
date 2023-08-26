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
import request from 'request';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'GraphQL Server';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = '127.0.0.1';
  const port = 4000;
  let runner;

  before(function() {
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

    // ping the graphql server
    describe('Develop command with GraphQL server / playground running', function() {
      let response = {
        body: '',
        code: 0
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://${hostname}:${port}`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res) => {
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
        expect(response.headers['content-type']).to.equal('text/html');
        done();
      });
    });

    // test a query call
    describe('Develop command with GraphQL server and running a query', function() {
      let response = {
        body: '',
        code: 0
      };

      const body = {
        'operationName': null,
        'variables': {},
        'query': '{\n  config {\n    workspace\n  }\n}\n'
      };

      before(async function() {
        return new Promise((resolve, reject) => {
          request.post({
            url: `http://${hostname}:${port}/graphql`,
            json: true,
            body
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response.status = res.statusCode;
            response.headers = res.headers;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
        done();
      });

      it('should return the expected query response', function(done) {
        expect(response.body.data.config.workspace).to.equal(new URL('./src/', import.meta.url).href);
        done();
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