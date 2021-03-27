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
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  let setup;

  before(async function() {
    setup = new TestBed();
    await setup.setupTestBed(__dirname);
  });

  describe('Custom Configuration with a bad value for optimization', function() {
    it('should throw an error that provided mode is not valid', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('Error: provided optimization "loremipsum" is not supported.  Please use one of: default, none.');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});