/*
 * Use Case
 * Run Greenwood build command with a bad value for themeFile in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   themeFile: '{}'
 * }
 *
 * User Workspace
 * Greenwood default
 */
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  let setup;

  before(async function() {
    setup = new TestBed();
    await setup.setupTestBed(__dirname);
  });

  describe('Custom Configuration with a bad value for theme file', function() {
    it('should throw an error that themeFile must be a filename', async function() {
      try {
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('Error: greenwood.config.js themeFile must be a valid filename. got {} instead.');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});