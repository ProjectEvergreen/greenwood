/*
 * Use Case
 * Scaffold from minimal template using the --yarn flag.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * @greenwood/init --yarn
 *
 * User Workspace
 * N / A
 */
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Scaffold Greenwood With Yarn: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = path.join(__dirname, 'my-app');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('default minimal template', function () {

    before(async function() {
      await runner.setup(outputPath);
      await runner.runCommand(initPath, '--yarn');
    });

    describe('should install with Yarn', function () {
      const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');

      before(async function() {
        await runner.runCommand(cliPath, 'build');
      });
      
      runSmokeTest(['public', 'index'], LABEL);
    
      it('should generate a yarn.lock file', function() {
        expect(fs.existsSync(path.join(outputPath, 'yarn.lock'))).to.be.true;
      });

      it('should not generate a package-lock.json file', function() {
        expect(fs.existsSync(path.join(outputPath, 'package-lock.json'))).to.be.false;
      });

      it('should generate a public directory', function() {
        expect(fs.existsSync(path.join(outputPath, 'public'))).to.be.true;
      });
    });
  });

  after(function() {
    runner.teardown([outputPath]);
  });

});