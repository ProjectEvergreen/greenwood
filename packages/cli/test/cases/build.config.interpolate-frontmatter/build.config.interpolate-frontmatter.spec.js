/*
 * Use Case
 * Run Greenwood with interpolateFrontmatter configuration enabled.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly interpolated frontmatter variables in markdown and HTML.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   interpolateFrontmatter: true
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     blog/
 *       first-post.md
 *   templates/
 *     blog.html
 */
import { JSDOM } from 'jsdom';
import path from 'path';
import chai from 'chai';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Frontmatter Interpolation';
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

    describe('Frontmatter should be interpolated in the correct places', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './blog/first-post/index.html'));
      });

      it('should have the correct value for author <meta> tag in the <head>', function() {
        const authorMeta = dom.window.document.querySelector('head meta[name=author]').getAttribute('content');

        expect(authorMeta).to.be.equal('Owen Buckley');
      });

      it('should have the correct value for publised in the <h3> tag', function() {
        const heading = dom.window.document.querySelector('body h3').textContent;

        expect(heading).to.be.equal('Published: 11/11/2022');
      });

      it('should have the correct value for authro in the <h4> tag', function() {
        const heading = dom.window.document.querySelector('body h4').textContent;

        expect(heading).to.be.equal('Author: Owen Buckley');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});