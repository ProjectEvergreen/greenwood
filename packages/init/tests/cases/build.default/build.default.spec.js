/*
 * Use Case
 * Scaffold from minimal template and run Greenwood build command with no config.
 *
 * User Result
 * Should scaffold from template build.
 *
 * User Command
 * @greenwood/init
 * greenwood build
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 * greenwood.config.js
 * package.json
 */

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Scaffold Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('default minimal template', function () {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(initPath);
    });

    describe('should copy project files', () => {
      it('should create a src directory', function() {
        expect(fs.existsSync(path.join(__dirname, 'src'))).to.be.true;
      });
      describe('in the src directory:', () => {
        it('should create a pages directory', function() {
          expect(fs.existsSync(path.join(__dirname, 'src', 'pages'))).to.be.true;
        });
        describe('in the src/pages directory:', () => {
          it('should copy the index.md page', function() {
            expect(fs.existsSync(path.join(__dirname, 'src', 'pages', 'index.md'))).to.be.true;
          });
        });
      });
      it('should copy the greenwood config file', function () {
        expect(fs.existsSync(path.join(__dirname, 'greenwood.config.js'))).to.be.true;
      });
    });

    it('should generate a gitignore file', function() {
      expect(fs.existsSync(path.join(__dirname, '.gitignore'))).to.be.true;
    });

    it('should generate a package.json file', function() {
      expect(fs.existsSync(path.join(__dirname, 'package.json'))).to.be.true;
    });

    it('the package.json should have the correct scripts', function() {
      const scripts = require(path.join(__dirname, 'package.json')).scripts;

      expect(scripts.start).to.equal('greenwood develop');
      expect(scripts.build).to.equal('greenwood build');
      expect(scripts.serve).to.equal('greenwood serve');

    });

    describe(`should build ${LABEL}`, function () {
      const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');

      before(async function() {
        await runner.setup(outputPath, getSetupFiles(outputPath));
        await runner.runCommand(cliPath, 'build');
      });
      
      runSmokeTest(['public', 'index'], LABEL);
    });
  });
  after(function() {
    runner.teardown([
      ...getOutputTeardownFiles(outputPath),
      path.join(outputPath, 'src'),
      path.join(outputPath, 'greenwood.config.js'),
      path.join(outputPath, 'package.json'),
      path.join(outputPath, '.gitignore')
    ]);
  });
});