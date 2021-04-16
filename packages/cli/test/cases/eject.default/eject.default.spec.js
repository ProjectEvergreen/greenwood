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
const TestBed = require('../../../../../test/test-bed');

describe('Eject Greenwood', function() {
  let setup;
  let configFiles;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe('Default Eject', function() {

    before(async function() {
      await setup.runGreenwoodCommand('eject');

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
      await setup.runGreenwoodCommand('eject');
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index'], 'Eject and Build Ejected Config');
  });

  after(function() {
    // remove test files
    configFiles.forEach(file => {
      fs.unlinkSync(path.join(__dirname, file));
    });

    setup.teardownTestBed();
  });
});