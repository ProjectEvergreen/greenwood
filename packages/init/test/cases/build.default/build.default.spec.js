/*
 * Use Case
 * Scaffold from minimal template and run Greenwood build command.
 *
 * User Result
 * Should scaffold from template and run the buildå.
 *
 * User Command
 * @greenwood/init --install && greenwood buildå
 *
 * User Workspace
 * N / A
 */
import chai from 'chai';
import fs from 'fs';
import path from 'path';
import { Runner } from '../../../../../runner.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

// https://github.com/ProjectEvergreen/greenwood/issues/787
xdescribe('Scaffold Greenwood and Run Build command: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = fileURLToPath(new URL('./my-app', import.meta.url));
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
      await runner.runCommand(initPath, '--install');
    });

    describe(`should build ${LABEL}`, function () {
      const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');

      before(async function() {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, 'build');
      });
      
      runSmokeTest(['public', 'index'], LABEL);
    
      it('should generate a package-lock.json file', function() {
        expect(fs.existsSync(path.join(outputPath, 'package-lock.json'))).to.be.true;
      });

      it('should not generate a yarn.lock file', function() {
        expect(fs.existsSync(path.join(outputPath, 'yarn.lock'))).to.be.false;
      });
    });
  });

  after(function() {
    runner.teardown([outputPath]);
  });

});