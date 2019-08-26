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

describe('Build Greenwood With: ', () => {
  let setup;

  before(async () => {
    setup = new TestBed();
    setup.setupTestBed(__dirname);
  });

  describe('Custom Configuration with a bad value for Title', () => {
    it('should throw an error that title must be a string', async () => {
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