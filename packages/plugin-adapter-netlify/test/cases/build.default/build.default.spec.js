/*
 * Use Case
 * Run Greenwood with the Netlify adapter plugin.
 *
 * User Result
 * Should generate a static Greenwood build with serverless and edge functions output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterNetlify } from '@greenwood/plugin-adapter-netlify';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginAdapterNetlify()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     card.js
 *   pages/
 *     artists.js
 *   services/
 *     artists.js
 *     greeting.js
 */
import chai from 'chai';
import glob from 'glob-promise';
// import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Netlify Adapter plugin output';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
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

    describe('Default Output files', function() {
      let zipFiles;

      before(async function() {
        zipFiles = await glob.promise(path.join(outputPath, 'netlify/functions/*.zip'));
        // dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output two serverless function zip files', function() {
        expect(zipFiles.length).to.be.equal(2);
      });
    });

    describe('API Route adapter', function() {
      // let dom;
      // let scripts;

      // before(async function() {
      //   scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      //   dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      // });

      // it('should contain one bundled output file in the output directory', function() {
      //   expect(scripts.length).to.be.equal(1);
      // });

      // it('should have the expected <script> tag in the <head> for the <app-footer> component', function() {
      //   const scripts = dom.window.document.querySelectorAll('head > script');

      //   expect(scripts.length).to.equal(1);
      // });
    });

    describe('SSR Page adapter', function() {
      // let dom;
      // let scripts;

      // before(async function() {
      //   scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      //   dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      // });

      // it('should contain one bundled output file in the output directory', function() {
      //   expect(scripts.length).to.be.equal(1);
      // });

      // it('should have the expected <script> tag in the <head> for the <app-footer> component', function() {
      //   const scripts = dom.window.document.querySelectorAll('head > script');

      //   expect(scripts.length).to.equal(1);
      // });
    });
  });

  after(function() {
    runner.teardown([
      path.join(outputPath, 'netlify'),
      ...getOutputTeardownFiles(outputPath)
    ]);
  });

});