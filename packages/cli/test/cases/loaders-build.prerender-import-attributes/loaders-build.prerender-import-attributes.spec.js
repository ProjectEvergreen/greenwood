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

describe('Build Greenwood With: ', function() {
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

    describe('Custom Element Importing CSS w/ Constructable Stylesheet', function() {
      const cssFileHash = '93e8cf36';
      let scripts;
      let styles;

      before(async function() {
        scripts = await glob.promise(path.join(outputPath, 'public/hero.*.js'));
        styles = await glob.promise(path.join(outputPath, `public/hero.${cssFileHash}.css`));
      });

      it('should have the expected import attribute for importing hero.css as a Constructable Stylesheet in the hero.js bundle', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.contain('import e from"/hero.93e8cf36.css"with{type:"css"}');
      });

      it('should have the expected CSS output bundle for hero.css', function() {
        const styleContents = fs.readFileSync(styles[0], 'utf-8');

        expect(styles.length).to.equal(1);
        expect(styleContents).to.contain(':host{text-align:center;margin-bottom:40px;}');
      });
    });

    describe('Importing JSON', function() {
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