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
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    // TODO runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);
  });

  after(function() {
    setup.teardownTestBed();
  });
});