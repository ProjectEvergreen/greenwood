/*
 * Use Case
 * Run Greenwood build command with no config and custom workspace testing for file / directory name collisions.
 * See this issue for more details: https://github.com/ProjectEvergreen/greenwood/issues/132
 *
 * User Result
 * Should generate a bare bones Greenwood build with out any errors due to naming.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       header.js
 *   pages/
 *     about.md
 *     index.md
 *   services/
 *     components.js
 *     pages/
 *       pages.js
 *   templates/
 *     page-template.js
 */
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Naming Collisions';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async () => {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index', 'not-found'], LABEL);
  });

  after(function() {
    setup.teardownTestBed();
  });

});