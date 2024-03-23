/*
 * Use Case
 * Run Greenwood with prerendering of CSS and JSON being referenced using import attributes.
 *
 * User Result
 * Should generate a static Greenwood build with CSS properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportCss()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero/
 *       hero.css
 *       hero.js
 *       hero.json
*    index.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('(Experimental) Build Greenwood With: ', function() {
  const LABEL = 'ESM Import Attribute for CSS and JSON with prerendering';
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

    runSmokeTest(['public'], LABEL);

    describe('importing CSS w/ Constructable Stylesheets', function() {
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      });

      it('should have the expected output from importing hero.css as a Constructable Stylesheet', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('const e=new CSSStyleSheet;e.replaceSync(":host {   text-align: center');
      });
    });

    describe('importing JSON', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have the expected inline content from the JSON file', function() {
        const hero = new JSDOM(dom.window.document.querySelector('app-hero template[shadowrootmode="open"]').innerHTML);
        const heading = hero.window.document.querySelectorAll('div.hero h2');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.be.equal('Welcome to my website');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});