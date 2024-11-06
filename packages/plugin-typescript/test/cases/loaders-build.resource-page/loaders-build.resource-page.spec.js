/*
 * Use Case
 * Run Greenwood with a dynamic page written in TypeScript.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true,
 *   plugins: [
 *      greenwoodPluginTypeScript()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     greeting.ts
 *   pages/
 *     index.html
 *     about.ts
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
  const LABEL = 'Custom TypeScript Plugin and Default Workspace serving a page';
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

      it('should have expected text from from index.html in the script output file', function() {
        const contents = fs.readFileSync(homePage[0], 'utf-8');

        expect(contents).to.contain('My TS Website');
      });
    });

    describe('Custom Format Dynamic About Page', function() {
      let aboutPage;

      before(async function() {
        aboutPage = await glob.promise(path.join(this.context.publicDir, '*about/index.html'));
      });

      it('should have the expected page HTML file in the output directory', function() {
        expect(aboutPage).to.have.lengthOf(1);
      });

      it('should have expected text from about.ts in the page output', function() {
        const contents = fs.readFileSync(aboutPage[0], 'utf-8');

        expect(contents).to.contain('Welcome to our About page!');
      });

      it('should have expected text from greeting.ts in the page output', function() {
        const contents = fs.readFileSync(aboutPage[0], 'utf-8');

        expect(contents).to.contain('<h3>Hello About Page!</h3>');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});