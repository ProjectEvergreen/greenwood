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
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Custom Assets Folder';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

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
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});