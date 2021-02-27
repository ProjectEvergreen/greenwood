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
 *     type: 'indexxxx',
 *     name: 'plugin-something',
 *     provider: function() { }
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

  describe('Custom Configuration with a bad value for plugin type', function() {
    it('should throw an error that plugin.type is not a valid value', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js plugins must be one of type "resource, rollup, server". got "indexxx" instead.');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});