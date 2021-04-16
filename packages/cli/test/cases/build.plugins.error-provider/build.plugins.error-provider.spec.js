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
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  let setup;

  before(async function() {
    setup = new TestBed();
    await setup.setupTestBed(__dirname);
  });

  describe('Custom Configuration with a bad provider value for a plugin', function() {
    it('should throw an error that plugin.provider is not a function', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js plugins provider must be a function. got object instead.');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});