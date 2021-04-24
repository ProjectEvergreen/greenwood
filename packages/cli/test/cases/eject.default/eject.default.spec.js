/*
 * Use Case
 * Run Greenwood eject command to copy core configuration files
 *
 * User Result
 * Should eject configuration files to working directory
 *
 * User Command
 * greenwood eject
 */
const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Eject Greenwood', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;
  let configFiles;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Default Eject', function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'eject');

      configFiles = fs.readdirSync(__dirname)
        .filter((file) => path.extname(file) === '.js' && file.indexOf('spec.js') < 0);
    });

    it('should output one config files to users project working directory', function() {
      expect(configFiles.length).to.equal(1);
    });

    it('should output rollup config file', function() {
      expect(fs.existsSync(path.join(__dirname, 'rollup.config.js'))).to.be.true;
    });

    after(function() {
      // remove test files
      configFiles.forEach(file => {
        fs.unlinkSync(path.join(__dirname, file));
      });
    });
  });

  describe('Eject and Build Ejected Config', function() {

    before(async function() {
      await runner.runCommand(cliPath, 'build');
      await runner.runCommand(cliPath, 'eject');
    });

    runSmokeTest(['public', 'index'], 'Eject and Build Ejected Config');
  });

  after(function() {
    // remove test files
    configFiles.forEach(file => {
      fs.unlinkSync(path.join(__dirname, file));
    });

    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});