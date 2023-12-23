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
import fs from 'fs';
import path from 'path';
import chai from 'chai';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Eject Greenwood', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;
  let configFiles;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Default Eject', function() {

    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'eject');

      configFiles = fs.readdirSync(fileURLToPath(new URL('.', import.meta.url)))
        .filter((file) => path.extname(file) === '.js' && file.indexOf('spec.js') < 0);
    });

    it('should output one config files to users project working directory', function() {
      expect(configFiles.length).to.equal(1);
    });

    it('should output rollup config file', function() {
      expect(fs.existsSync(fileURLToPath(new URL('./rollup.config.js', import.meta.url)))).to.be.true;
    });

    after(function() {
      // remove test files
      configFiles.forEach(file => {
        fs.unlinkSync(fileURLToPath(new URL(`./${file}`, import.meta.url)));
      });
    });
  });

  describe('Eject and Build Ejected Config', function() {

    before(function() {
      runner.runCommand(cliPath, 'build');
      runner.runCommand(cliPath, 'eject');
    });

    runSmokeTest(['public', 'index'], 'Eject and Build Ejected Config');
  });

  after(function() {
    // remove test files
    configFiles.forEach(file => {
      fs.unlinkSync(fileURLToPath(new URL(`./${file}`, import.meta.url)));
    });

    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});