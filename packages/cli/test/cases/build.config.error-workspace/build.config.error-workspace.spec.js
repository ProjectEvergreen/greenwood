/*
 * Use Case
 * Run Greenwood build command with a bad value for workspace directory in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: 123
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

  describe('Custom Configuration with a bad value for Workspace', function() {
    it('should throw an error that workspace path must be a string', async function() {
      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('greenwood.config.js workspace path must be a string');
      }
    });
  });

});