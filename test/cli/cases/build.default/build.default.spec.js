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

describe('Build Greenwood With: ', () => {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  let setup;
  let context;

  before(() => {
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