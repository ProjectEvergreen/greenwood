/*
 * Use Case
 * Run Greenwood with activeContent configuration enabled for simple and active frontmatter.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly interpolated frontmatter variables in markdown and HTML.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeContent: true
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *   layouts/
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
  const LABEL = 'Active Frontmatter';
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

    describe('Default Greenwood frontmatter should be interpolated in the correct places for the home page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have the correct value for the <title> tag in the <head> for the home page', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('Home');
      });

      it('should have the correct graph value for id in a <span> tag', function() {
        const id = dom.window.document.querySelector('body span.id').textContent;

        expect(id).to.be.equal('index');
      });

      it('should have the correct graph value for route in a <span> tag', function() {
        const route = dom.window.document.querySelector('body span.route').textContent;

        expect(route).to.be.equal('/');
      });

      it('should have the correct graph value for label in a <span> tag', function() {
        const label = dom.window.document.querySelector('body span.label').textContent;

        expect(label).to.be.equal('Home');
      });
    });

    describe('Simple frontmatter should be interpolated in the correct places', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './blog/first-post/index.html'));
      });

      it('should have the correct value for author <meta> tag in the <head>', function() {
        const authorMeta = dom.window.document.querySelector('head meta[name=author]').getAttribute('content');

        expect(authorMeta).to.be.equal('Owen Buckley');
      });

      it('should have the correct value for published in the <h3> tag', function() {
        const heading = dom.window.document.querySelector('body h3').textContent;

        expect(heading).to.be.equal('Published: 11/11/2022');
      });

      it('should have the correct value for author in the <h4> tag', function() {
        const heading = dom.window.document.querySelector('body h4').textContent;

        expect(heading).to.be.equal('Author: Owen Buckley');
      });
    });

    describe('Rich frontmatter should be interpolated in the correct places', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './blog/second-post/index.html'));
      });

      it('should have the correct songs frontmatter data in the page output', function() {
        const contents = dom.window.document.querySelector('body span').innerHTML;
        const songs = JSON.parse(contents);

        expect(songs.length).to.equal(2);

        songs.forEach((song, idx) => {
          const num = idx += 1;

          expect(song.title).to.equal(`Song ${num}`);
          expect(song.url).to.equal(`song${num}.mp3`);
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});