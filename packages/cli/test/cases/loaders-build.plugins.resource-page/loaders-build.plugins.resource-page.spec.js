/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace with a custom page formats.
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected custom page format behaviors.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * class FooResource extends ResourceInterface {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * class BarResource extends ResourceInterface {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * {
 *   plugins: [{
 *     type: 'resource',
 *     name: 'plugin-foo',
 *     provider: (compilation, options) => new FooResource(compilation, options)
 *   },{
 *     type: 'resource',
 *     name: 'plugin-bar',
 *     provider: (compilation, options) => new BarResource(compilation, options)
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     api
 *       greeting.bar
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
  const LABEL = 'Custom Static and Dynamic Page Loaders';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
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

    describe('Custom Format Dynamic Contact Page (exported with prerendering)', function() {
      let contactPage;

      before(async function() {
        contactPage = await glob.promise(path.join(this.context.publicDir, 'contact/index.html'));
      });

      it('should have the expected pre-rendered HTML file in the output directory', function() {
        expect(contactPage).to.have.lengthOf(1);
      });

      it('should have expected text from the output HTML file', function() {
        const contents = fs.readFileSync(contactPage[0], 'utf-8');

        expect(contents).to.contain('Welcome to our Contact page!');
      });
    });

    describe('Custom Format Dynamic API Route', function() {
      let handler;

      before(async function() {
        handler = (await import(new URL('./public/api/greeting.js', import.meta.url))).handler;
      });

      it('should have the expected output from the API route', async function() {
        const response = await handler(new Request(new URL('http://localhost:8080/api/greeting')));
        const data = await response.json();

        expect(data.message).to.equal('Hello World!!!');
      });

    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});