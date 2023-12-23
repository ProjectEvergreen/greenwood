/*
 * Use Case
 * Run Greenwood build command with a workspace that uses frontmatter imports.
 * Added prerender: true to showcase prerendering WCs in markdown
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * export default {
 *   prerender: true
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     counter/
 *       counter.js
 *       counter.css
 *   pages/
 *     examples/
 *       counter.md
 *     index.md
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace with Frontmatter Imports';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Content and file output for the Demo page', function() {
      let dom;
      let html;

      before(async function() {
        const htmlPath = path.resolve(this.context.publicDir, 'examples/demo', 'index.html');

        dom = await JSDOM.fromFile(path.resolve(htmlPath));
        html = await fs.promises.readFile(htmlPath, 'utf-8');
      });

      it('should output a counter.css file from frontmatter import', async function() {
        const cssFiles = await glob.promise(`${this.context.publicDir}**/**/counter.*.css`);

        expect(cssFiles).to.have.lengthOf(1);
      });

      it('should output a counter.js file from frontmatter import', async function() {
        const jsFiles = await glob.promise(`${this.context.publicDir}**/**/counter.*.js`);

        expect(jsFiles).to.have.lengthOf(1);
      });

      it('should output a multi-hyphen.js file from frontmatter import', async function() {
        const jsFiles = await glob.promise(`${this.context.publicDir}**/**/multi-hyphen.*.js`);

        expect(jsFiles).to.have.lengthOf(1);
      });

      it('should a page heading', function() {
        const heading = dom.window.document.querySelectorAll('body h2');

        expect(heading.length).to.be.equal(1);
        expect(heading[0].textContent).to.be.equal('Demo Page Example');
      });

      describe('Counter <x-counter> component from front matter that is prerendered', () => {
        it('should output a custom <x-counter> tag that', function() {
          const counter = dom.window.document.querySelectorAll('body x-counter');

          expect(counter.length).to.be.equal(1);
        });

        it('should output a custom <x-counter> tag that is _not_ wrapped in a <p> tag', function() {
          expect((/<p><x-counter>/).test(html)).to.be.false;
          expect((/<\/x-counter><\/p>/).test(html)).to.be.false;
        });

        it('should output a heading tag from the custom element', function() {
          expect(html).to.contain('<h3>My Counter</h3>');
        });
      });

      describe('Custom Multihyphen component', () => {
        it('should output a custom <multihyphen-custom-element> tag', function() {
          const hyphen = dom.window.document.querySelectorAll('body multihyphen-custom-element');

          expect(hyphen.length).to.be.equal(1);
        });

        it('should output a <multihyphen-custom-element> tag that is _not_ wrapped in a <p> tag', function() {
          expect((/<p><multihyphen-custom-element>/).test(html)).to.be.false;
          expect((/<\/multihyphen-custom-element><\/p>/).test(html)).to.be.false;
        });

        it('should have the expected prerendered content', function() {
          expect(html).to.contain('I have multiple hyphens in my tag name!');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});