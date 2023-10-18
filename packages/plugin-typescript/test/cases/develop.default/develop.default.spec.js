/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and process TypeScript (.ts) files.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * TypeScript Plugin
 *
 * User Workspace
 * src/
 *   main.ts
 *
 */
import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import { runSmokeTest } from '../../../../../test/smoke-test.js';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'TypeScript plugin for resolving .ts files';
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
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific .ts behaviors', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`http://127.0.0.1:${port}/main.ts`);
        data = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
      });

      it('should return an ECMAScript module', function() {
        expect(data.trim().indexOf('const user')).to.equal(0);
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