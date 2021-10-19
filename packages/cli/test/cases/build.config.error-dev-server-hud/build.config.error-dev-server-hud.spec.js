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
 *     hud: 1234
 *   }
 * }
 *
 * User Workspace
 * Greenwood default
 */
const expect = require('chai').expect;
const path = require('path');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad value for devServer.hud', function() {
    it('should throw an error that provided extensions is not valid', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js devServer hud options must be a boolean.  Passed value was: 1234');
      }
    });
  });

});