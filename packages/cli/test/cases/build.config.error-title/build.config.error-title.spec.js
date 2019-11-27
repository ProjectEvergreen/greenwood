/*
 * Use Case
 * Run Greenwood build command with a bad value for title in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   title: {}
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

  describe('Custom Configuration with a bad value for Title', function() {
    it('should throw an error that title must be a string', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('greenwood.config.js title must be a string');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});