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

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Configuration for Workspace (www) and Default Greenwood configuration';
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