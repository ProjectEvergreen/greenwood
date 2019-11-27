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
    it('should throw an error that plugin.type is not valid must be a string', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js plugins provider must of type function. got object instead');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});