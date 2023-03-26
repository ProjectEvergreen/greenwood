/*
 * Use Case
 * Run Greenwood serve command without having already run greenwood build.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * N / A
 *
 * User Workspace
 * Greenwood default
 */
import chai from 'chai';
import path from 'path';
import { getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Running the serve command without running the build command first', function() {
    it('should throw an error that no build output was detected', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'serve');
      } catch (err) {
        expect(err).to.contain('No build output detected.  Make sure you have run greenwood build');
      }
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});