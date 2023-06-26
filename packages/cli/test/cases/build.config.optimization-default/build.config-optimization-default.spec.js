/*
 * Use Case
 * Run Greenwood build command with default setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that preloads all <script> and <link> tags
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getDependencyFiles, getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Optimization Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const expectedCss = fs.readFileSync(path.join(outputPath, './fixtures/expected.css'), 'utf-8').replace(/\n/g, '');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const prismCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/themes/*.css`,
        `${outputPath}/node_modules/prismjs/themes/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...prismCss
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    describe('Output for JavaScript / CSS tags and files', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      describe('<script> tag and preloading', function() {
        it('should contain one javascript file in the output directory', async function() {
          expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(1);
        });

        it('should have the expected <script> tag in the <head>', function() {
          const scriptTags = dom.window.document.querySelectorAll('head script');

          expect(scriptTags.length).to.be.equal(1);
        });

        it('should have the expect modulepreload <link> tag for the same <script> tag src in the <head>', function() {
          const preloadScriptTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="modulepreload"]'))
            .filter(link => link.getAttribute('as') === 'script');

          expect(preloadScriptTags.length).to.be.equal(1);
          expect(preloadScriptTags[0].href).to.match(/header.*.js/);
        });
      });

      describe('<link> tag and preloading', function() {
        it('should contain one style.css in the output directory', async function() {
          expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/main.*.css`)).to.have.lengthOf(1);
        });

        it('should have the expected <link> tag in the <head>', function() {
          const linkTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="preload"]'))
            .filter(tag => tag.getAttribute('as') === 'style');

          expect(linkTags.length).to.be.equal(1);
        });

        it('should have the expect preload <link> tag for the same <link> tag href in the <head>', function() {
          const preloadLinkTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="preload"]'))
            .filter(link => link.getAttribute('as') === 'style');

          expect(preloadLinkTags.length).to.be.equal(1);
          expect(preloadLinkTags[0].href).to.match(/\/styles\/main.*.css/);
          expect(preloadLinkTags[0].getAttribute('crossorigin')).to.equal('anonymous');
        });

        // test custom CSS bundling
        it('should have the expect preload CSS content in the file', async function() {
          const cssFiles = await glob.promise(path.join(this.context.publicDir, 'styles/*.css'));
          const customCss = await fs.promises.readFile(cssFiles[0], 'utf-8');

          expect(cssFiles.length).to.be.equal(1);
          expect(customCss).to.be.equal(expectedCss);
        });
      });

      describe('<style> tags on the page', function() {
        it('should have the expected inline content for prism.css @import in the <style> tag in the <head>', function() {
          const headStyleTags = Array.from(dom.window.document.querySelectorAll('head style'));

          expect(headStyleTags.length).to.be.equal(1);
          expect(headStyleTags[0].textContent.indexOf('code[class*=\'language-\']')).to.equal(0);
        });

        it('should have the expected contents of the <style> tag in the <body>', async function() {
          const styleTags = Array.from(dom.window.document.querySelectorAll('body style'));

          expect(styleTags.length).to.equal(1);
          expect(styleTags[0].textContent.replace(/\n/g, '')).to.equal('*{color:red;font-size:blue;}');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});