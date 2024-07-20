/*
 * Use Case
 * Run Greenwood serve command with no config for using import attributes with a basic static bundles.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   components/
 *     card/
 *       card.css
 *       card.js
 *       card.json
 *   pages/
 *     index.html
 *
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import path from 'path';
import { Runner } from 'gallinago';
import { getOutputTeardownFiles } from '../../../../../test/utils.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Import Attributes used in static pages';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath);
      runner.runCommand(cliPath, 'build');
    });

    describe('Importing CSS w/ Constructable Stylesheets', function() {
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(outputPath, 'public/card.*.js'));
      });

      it('should have the expected output from importing hero.css as a Constructable Stylesheet', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('import e from"/card.bcdce3a3.css"with{type:"css"}');
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});