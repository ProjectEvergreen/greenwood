/*
 * Use Case
 * Run Greenwood build command with a bad value for the type of a plugin.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [{
 *     type: 'resource',
 *     plugin: function () { }
 *  }]
 * }
 *
 * User Workspace
 * Greenwood default (src/)
 *
 */

import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad name value for a plugin', function() {
    it('should throw an error that plugin.name is not a string', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js plugins must have a name. got undefined instead.');
      }
    });
  });

});