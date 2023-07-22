/*
 * Use Case
 * Run Greenwood with custom markdown preset in greenwood config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom markdown and rehype links
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default
 */
import { JSDOM } from 'jsdom';
import path from 'path';
import chai from 'chai';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Markdown';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Markdown Rendering', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/1126
      it('should correctly render an <h2> tag with a $1 in the text content', function() {
        const heading = dom.window.document.querySelectorAll('body h2');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Posters $10');
      });

      it('should correctly render an <h3> tag', function() {
        const heading = dom.window.document.querySelectorAll('body h3');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Greenwood Markdown Test');
      });

      it('should correctly render a <p> tag', function() {
        const paragraph = dom.window.document.querySelectorAll('body p');

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.be.equal('This is some markdown being rendered by Greenwood.');
      });

      it('should correctly render markdown with a <code> tag', function() {
        const code = dom.window.document.querySelectorAll('body pre code');

        expect(code.length).to.equal(1);
        expect(code[0].textContent).to.contain('console.log(\'hello world\');');
      });

      it('should correctly render markdown with an HTML <img> tag in it', function() {
        const images = dom.window.document.querySelectorAll('body img');
        const myImage = images[0];

        expect(images.length).to.equal(1);
        expect(myImage.src).to.contain('my-image.png');
        expect(myImage.alt).to.equal('just passing by');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});