/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace with a custom page format.
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
 *     about.foo
 *     contact.bar
 *     index.html
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
    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    describe('Home Page', function() {
      let homePage;

      before(async function() {
        homePage = await glob.promise(path.join(this.context.publicDir, 'index.html'));
      });

      it('should have expected text from from my-other-custom-file.foo in the script output file', function() {
        const contents = fs.readFileSync(homePage[0], 'utf-8');

        expect(contents).to.contain('My Foo Website');
      });
    });

    describe('Custom Format Static About Page', function() {
      let aboutPage;

      before(async function() {
        aboutPage = await glob.promise(path.join(this.context.publicDir, '*about/index.html'));
      });

      it('should have the expected JavaScript equivalent file in the output directory', function() {
        expect(aboutPage).to.have.lengthOf(1);
      });

      it('should have expected text from from my-other-custom-file.foo in the script output file', function() {
        const contents = fs.readFileSync(aboutPage[0], 'utf-8');

        expect(contents).to.contain('Welcome to our About page!');
      });
    });

    xdescribe('Custom Format Dynamic Contact Page', function() {
      let aboutPage;

      before(async function() {
        aboutPage = await glob.promise(path.join(this.context.publicDir, 'contact.html'));
      });

      it('should have the expected JavaScript equivalent file in the output directory', function() {
        expect(aboutPage).to.have.lengthOf(1);
      });

      it('should have expected text from from my-other-custom-file.foo in the script output file', function() {
        const contents = fs.readFileSync(aboutPage[0], 'utf-8');

        expect(contents).to.contain('Welcome to our About page!');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});