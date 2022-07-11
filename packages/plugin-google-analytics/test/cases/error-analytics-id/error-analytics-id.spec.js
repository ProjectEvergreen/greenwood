/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin.
 *
 * User Result
 * Should generate an error when not passing in a valid analyticsId.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginGoogleAnalytics } from '@greenwood/plugin-google-analytics';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginGoogleAnalytics()
 *  }]
 *
 * }
 *
 * User Workspace
 * Greenwood default (src/)
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

  describe('Google Analytics Plugin with a bad value for analyticsId', function() {
    it('should throw an error that analyticsId must be a string', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: analyticsId should be of type string.  got "undefined" instead.');
      }
    });
  });

  after(function() {
    runner.teardown();
  });

});