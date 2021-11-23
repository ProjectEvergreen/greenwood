/*
 * Use Case
 * Run Greenwood build command with a bad value for mode in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'lorumipsum'
 * }
 *
 * User Workspace
 * Greenwood default
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

  describe('Custom Configuration with a bad value for optimization', function() {
    it('should throw an error that provided optimization is not valid', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: provided optimization "loremipsum" is not supported.  Please use one of: default, none, static, inline.');
      }
    });
  });

});