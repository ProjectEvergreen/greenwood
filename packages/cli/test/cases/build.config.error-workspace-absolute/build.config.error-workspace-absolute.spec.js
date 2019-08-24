/*
 * Use Case
 * Run Greenwood build command with a bad value for workspace directory (that doesn't exist) in a custom config.
 * 
 * User Result
 * Should throw an error.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   workspace: path.join(__dirname, 'noop')
 * }
 * 
 * User Workspace
 * Greenwood default
 */
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', () => {
  let setup;

  before(async () => {
    setup = new TestBed();
    setup.setupTestBed(__dirname);
  });

  describe('Custom Configuration with a bad value (absolute path) for Workspace', () => {
    it('should throw an error that workspace path must exist', async () => {
      try { 
        await setup.runGreenwoodCommand('build');
      } catch (err) {
        expect(err).to.contain('greenwood.config.js workspace doesn\'t exist!');
      }
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});