/*
 * Use Case
 * Run Greenwood build command with custom workspace directory and Greenwood defaults.
 * 
 * User Result
 * Should generate a bare bones Greenwood build from www directory.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   workspace: path.join(__dirname, 'www')
 * }
 * 
 * User Workspace
 * Greenwood default
 */
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', () => {
  const LABEL = 'Custom Configuration for Workspace (www) and Default Greenwood configuration';
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
      await runSmokeTest(['public', 'index', 'not-found'], context, setup, LABEL);
    });
  });

});