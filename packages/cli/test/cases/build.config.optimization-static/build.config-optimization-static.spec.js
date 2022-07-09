/*
 * Use Case
 * Run Greenwood build command with static setting for optimization.
 *
 * User Result
 * Should generate a Greenwood build that strips all <script> tags and files from the final HTML and output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'static'
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Static Optimization Configuration';
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

    describe('JavaScript <script> tag and file static optimization', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should emit no javascript files to the output directory', async function() {
        const jsFiles = await glob.promise(path.join(this.context.publicDir, '*.js'));
        
        expect(jsFiles).to.have.lengthOf(0);
      });

      it('should contain no <link> tags in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(0);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(0);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});