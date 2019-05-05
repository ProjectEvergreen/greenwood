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

// describe('Build Greenwood With: ', async () => {
//   let setup;
//   let context;

//   before(async () => {
//     setup = new TestBed();
//     context = setup.setupTestBed(__dirname);
//   });
  
//   describe('Empty Configuration and Default Workspace', () => {
//     before(async () => {     
//       await setup.runGreenwoodCommand('build');
//     });

//     it('should pass the smoke test', async () => {
//       await runSmokeTest(context, setup);
//     });
//   });

// });

describe('Build Greenwood With: ', () => {
  let setup;
  let context;

  before(() => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });

  describe('Default Greenwood Configuration and Workspace', () => {
    before(async () => {     
      await setup.runGreenwoodCommand('build');
    });

    it('should pass all smoke tests', async () => {
      await runSmokeTest(context, setup, 'Default Greenwood Configuration and Workspace');
    });
  });

});