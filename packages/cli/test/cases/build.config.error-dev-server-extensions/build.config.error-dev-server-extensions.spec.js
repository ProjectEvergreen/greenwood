/*
 * Use Case
 * Run Greenwood build command with a bad value for devServer.extensions in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   devServer: {
 *     extensions: true
 *   }
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

  describe('Custom Configuration with a bad value for devServer.extensions', function() {
    it('should throw an error that provided extensions is not valid', function() {
      try {
        runner.setup(outputPath);
        runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: provided extensions is not an array.  Please provide an array like [\'.txt\', \'.foo\']');
      }
    });
  });

});