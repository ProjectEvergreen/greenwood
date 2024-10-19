/*
 * Use Case
 * Run Greenwood build command with a bad value for isolation mode in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   isolation: {}
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

  describe('Custom Configuration with a bad value for Isolation', function() {
    it('should throw an error that isolation must be a boolean', function() {
      try {
        runner.setup(outputPath);
        runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js isolation must be a boolean; true or false.  Passed value was typeof: object');
      }
    });
  });

});