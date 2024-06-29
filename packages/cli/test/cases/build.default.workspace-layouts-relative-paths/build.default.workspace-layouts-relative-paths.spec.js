/*
 * Use Case
 * Run Greenwood build command with no config and custom page (and app) layouts using relative paths.
 *
 * User Result
 * Should generate the expected Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   components/
 *     footer.js
 *     greeting.js
 *     header.js
 *   styles/
 *     home.css
 *     page.css
 *     theme.css
 *   pages/
 *     one/
 *       two/
 *         three/
 *           index.md
 *     index.html
 *   layouts/
 *     app.html
 *     page.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App and Page Layout using relative paths';
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
      const prismCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/themes/prism-tomorrow.css`,
        `${outputPath}/node_modules/prismjs/themes/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...prismCss
      ]);
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom App and Page Layout using relative paths', function() {
      let cssFiles;
      let scriptFiles;

      before(async function() {
        cssFiles = await glob(`${this.context.publicDir}/**/**/*.css`);
        scriptFiles = await glob(`${this.context.publicDir}/**/**/*.js`);
      });

      describe('common styles and scripts file output', function() {
        it('should emit three javascript files (header, footer, greeting)', function() {
          expect(scriptFiles.length).to.be.equal(3);
        });

        it('should emit one javascript file for the header', function() {
          const header = scriptFiles.filter(file => file.indexOf('/header') >= 0);

          expect(header.length).to.be.equal(1);
        });

        it('should emit one javascript file for the footer', function() {
          const footer = scriptFiles.filter(file => file.indexOf('/footer') >= 0);

          expect(footer.length).to.be.equal(1);
        });

        it('should emit four CSS files for styles and assets/', function() {
          const styles = cssFiles.filter((file) => file.indexOf('/styles') >= 0);
          const assets = cssFiles.filter(file => file.indexOf('/assets') >= 0);

          expect(cssFiles.length).to.be.equal(4);
          expect(styles.length).to.be.equal(3);
          expect(assets.length).to.be.equal(1);
        });
      });

      describe('top level index (home) page content', function() {
        let dom;
        let scriptTags;
        let linkTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));

          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script'));
          linkTags = Array.from(dom.window.document.querySelectorAll('head > link[rel="stylesheet"'));
        });

        it('should have one <script> tags in the <head> for the header', function() {
          const headerTag = scriptTags.filter((tag) => {
            return tag.src.indexOf('/header') >= 0 && tag.src.indexOf('..') < 0;
          });
          expect(headerTag.length).to.be.equal(1);
        });

        it('should have one <script> tags in the <head> for the footer', function() {
          const footerTag = scriptTags.filter((tag) => {
            return tag.src.indexOf('/footer') >= 0 && tag.src.indexOf('..') < 0;
          });
          expect(footerTag.length).to.be.equal(1);
        });

        it('should have one <link> tag in the <head> for theme.css', function() {
          const themeTag = linkTags.filter((tag) => {
            return tag.href.indexOf('/theme') >= 0 && tag.href.indexOf('..') < 0;
          });
          expect(themeTag.length).to.be.equal(1);
        });

        it('should have one <link> tag in the <head> for home.css', function() {
          const homeTag = linkTags.filter((tag) => {
            return tag.href.indexOf('/home') >= 0 && tag.href.indexOf('..') < 0;
          });
          expect(homeTag.length).to.be.equal(1);
        });

        it('should have content output for the <app-footer> component', function() {
          const footer = dom.window.document.querySelectorAll('body app-footer');

          expect(footer.length).to.be.equal(1);
        });

        it('should have content output for the <app-header> component', function() {
          const header = dom.window.document.querySelectorAll('body app-header');

          expect(header.length).to.be.equal(1);
        });

        it('should have content output for the page', function() {
          const content = dom.window.document.querySelectorAll('body > h1');

          expect(content.length).to.be.equal(1);
          expect(content[0].textContent).to.be.equal('Home Page');
        });
      });

      describe('three level deep nested page content', function() {
        let dom;
        let scriptTags;
        let linkTags;

        before(async function() {
          dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'one/two/three', 'index.html'));

          scriptTags = Array.from(dom.window.document.querySelectorAll('head > script'));
          linkTags = Array.from(dom.window.document.querySelectorAll('head > link[rel="stylesheet"'));
        });

        it('should emit one javascript file for the greeting component from frontmatter import', function() {
          const greeting = scriptFiles.filter(file => file.indexOf('/greeting') >= 0);

          expect(greeting.length).to.be.equal(1);
        });

        it('should have one <script> tags in the <head> for the header', function() {
          const headerTag = scriptTags.filter((tag) => {
            return tag.src.indexOf('/header') >= 0 && tag.src.indexOf('..') < 0;
          });
          expect(headerTag.length).to.be.equal(1);
        });

        it('should have one <script> tags in the <head> for the footer', function() {
          const footerTag = scriptTags.filter((tag) => {
            return tag.src.indexOf('/footer') >= 0 && tag.src.indexOf('..') < 0;
          });
          expect(footerTag.length).to.be.equal(1);
        });

        it('should have one <script> tags in the <head> for the greeting from front matter import', function() {
          const greetingTag = scriptTags.filter((tag) => {
            return tag.src.indexOf('/greeting') >= 0 && tag.src.indexOf('..') < 0;
          });
          expect(greetingTag.length).to.be.equal(1);
        });

        it('should have one <link> tag in the <head> for theme.css', function() {
          const themeTag = linkTags.filter((tag) => {
            return tag.href.indexOf('/theme') >= 0 && tag.href.indexOf('..') < 0;
          });
          expect(themeTag.length).to.be.equal(1);
        });

        it('should have one <link> tag in the <head> for page.css', function() {
          const pageTag = linkTags.filter((tag) => {
            return tag.href.indexOf('/page') >= 0 && tag.href.indexOf('..') < 0;
          });
          expect(pageTag.length).to.be.equal(1);
        });

        it('should have content output for the <app-footer> component', function() {
          const footer = dom.window.document.querySelectorAll('body app-footer');

          expect(footer.length).to.be.equal(1);
        });

        it('should have content output for the <app-header> component', function() {
          const header = dom.window.document.querySelectorAll('body app-header');

          expect(header.length).to.be.equal(1);
        });

        it('should have content output for the page', function() {
          const content = dom.window.document.querySelectorAll('body > h1');

          expect(content.length).to.be.equal(1);
          expect(content[0].textContent).to.be.equal('One Two Three');
        });
      });

    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});