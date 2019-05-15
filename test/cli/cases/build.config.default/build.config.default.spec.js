/*
 * Use Case
 * Run Greenwood with empty config object and default workspace.
 * 
 * Uaer Result
 * TShould generate a bare bones Greenwood build.  (same as build.default.spec.js)
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {}
 * 
 * User Workspace
 * Greenwood default (src/)
 */
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Empty Configuration and Default Workspace';
  let setup;

  before(async function() {
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