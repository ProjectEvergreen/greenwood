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

describe('Build Greenwood With: ', async () => {
  const LABEL = 'Empty Configuration and Default Workspace';
  let setup;
  let context;

  before(async () => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, () => {
    before(async () => {     
      await setup.runGreenwoodCommand('build');
    });

    it('should pass all smoke tests', async () => {
      await runSmokeTest(['public', 'index', 'not-found', 'hello'], context, setup, LABEL);
    });
  });

});