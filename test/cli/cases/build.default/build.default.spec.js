/*
 * Use Case
 * Run Greenwood build command with no config.
 * 
 * User Result
 * Should generate a bare bones Greenwood build.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * None (Greenwood Default)
 * 
 * User Workspace
 * Greenwood default (src/)
 */
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  let setup;

  before(function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['public', 'index', 'not-found', 'hello', 'meta'], LABEL);
  });

  after(function() {
    setup.teardownTestBed();
  });
});