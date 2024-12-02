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
 * package.json
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

    describe('Custom Element Importing CSS w/ Constructable Stylesheet', function() {
      const cssFileHash = 'YPhf6BPs';
      let scripts;
      let styles;

      before(async function() {
        scripts = await glob.promise(path.join(outputPath, 'public/card.*.js'));
        styles = await glob.promise(path.join(outputPath, `public/card.${cssFileHash}.css`));
      });

      it('should have the expected import attribute for importing card.css as a Constructable Stylesheet in the card.js bundle', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.contain(`import r from"/card.${cssFileHash}.css"with{type:"css"};`);
      });

      it('should have the expected import attribute for importing @spectrum-css/card as a Constructable Stylesheet in the card.js bundle', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('const c=new CSSStyleSheet;c.replaceSync(".spectrum-Card{--spectrum-card-background-color');
      });

      it('should have the expected CSS output bundle for card.css', function() {
        const styleContents = fs.readFileSync(styles[0], 'utf-8');

        expect(styles.length).to.equal(1);
        expect(styleContents).to.equal(':host{color:red}');
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});