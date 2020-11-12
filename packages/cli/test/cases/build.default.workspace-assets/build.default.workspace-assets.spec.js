/*
 * Use Case
 * Run Greenwood build command with custom assets directory
 *
 * User Result
 * Should generate a Greenwood build with a public asset folder containing contents of assets directory
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Default Workspace
 */
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Custom Assets Folder';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // runSmokeTest(['public', 'index', 'not-found'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    describe('Assets folder', function() {

      it('should create a new assets directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'assets'))).to.be.true;
      });

      it('should contain files from the asset directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'assets', './brand.png'))).to.be.true;
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});