/*
 * Use Case
 * Run Greenwood build command with a bad value for templatesDirectory in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   templatesDirectory: {}
 * }
 *
 * User Workspace
 * Greenwood default
 */
import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad value for templatesDirectory', function() {
    it('should throw an error that templatesDirectory must be a string', function() {
      try {
        runner.setup(outputPath);
        runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: provided templatesDirectory "[object Object]" is not supported.  Please make sure to pass something like \'layouts/\'');
      }
    });
  });

});