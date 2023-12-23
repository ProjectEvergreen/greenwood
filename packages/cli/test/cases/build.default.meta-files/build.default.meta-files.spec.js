/*
 * Use Case
 * Run Greenwood build command with no config and a robots.txt.
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
 * src/
 *   favicon.ico
 *   robots.txt
 */
import chai from 'chai';
import glob from 'glob-promise';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace with common meta file';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Default output for project level favicon.ico', function() {
      let favicons;

      before(async function() {
        favicons = await glob(`${this.context.publicDir}/*.ico`);
      });

      it('should have one favicon file in the output directory', function() {
        expect(favicons.length).to.equal(1);
      });
    });

    describe('Default output for project level robots.txt', function() {
      let robots;

      before(async function() {
        robots = await glob(`${this.context.publicDir}/*.txt`);
      });

      it('should have one robots file in the output directory', function() {
        expect(robots.length).to.equal(1);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});