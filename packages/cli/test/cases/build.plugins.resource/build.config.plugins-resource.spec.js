/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected custom file (.foo) behavior.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * class FooResource extends ResourceInterface {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * {
 *   plugins: [{
 *     type: 'resource',
 *     name: 'plugin-foo',
 *     provider: (compilation, options) => new FooResource(compilation, options)
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     index.html
 *   foo-files/
 *     my-custom-file.foo
 *     my-other-custom-file.foo
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom FooResource Plugin and Default Workspace';
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
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    describe('Transpiling and DOM Manipulation', function() {
      let files;

      before(async function() {
        files = await glob.promise(path.join(this.context.publicDir, '*.js'));
      });

      it('should have the expected JavaScript equivalent file in the output directory', function() {
        expect(files).to.have.lengthOf(1);
      });

      it('should have expected text from from my-other-custom-file.foo in the script output file', function() {
        const contents = fs.readFileSync(files[0], 'utf-8');

        expect(contents).to.contain('hello from some-other-custom-file.foo!');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});