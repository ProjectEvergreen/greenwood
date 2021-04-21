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
 *     type: 'index',
 *     name: 'plugin-something',
 *     plugin: {}
 *  }]
 * }
 *
 * User Workspace
 * Greenwood default (src/)
 *
 */

const expect = require('chai').expect;
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad provider value for a plugin', function() {
    it('should throw an error that plugin.provider is not a function', async function() {
      try {
        await runner.setup(outputPath, getSetupFiles(outputPath));
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js plugins provider must be a function. got object instead.');
      }
    });
  });

  after(function() {
    runner.teardown();
  });

});