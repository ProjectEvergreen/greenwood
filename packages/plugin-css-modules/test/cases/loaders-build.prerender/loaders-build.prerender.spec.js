/*
 * Use Case
 * Run Greenwood build with CSS Modules plugin and pre-rendering.
 *
 * User Result
 * Should generate a Greenwood project with CSS Modules properly transformed.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginCssModules } import '@greenwood/plugin-css-modules';
 *
 * {
 *   prerender: true,
 *   plugins: [
 *     greenwoodPluginCssModules()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     footer/
 *       footer.js
 *       footer.module.css
 *     header/
 *       header.js
 *       header.module.css
 *     index.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import glob from 'glob-promise';
import path from 'path';
import { parse, walk } from 'css-tree';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import { implementation } from 'jsdom/lib/jsdom/living/nodes/HTMLStyleElement-impl.js';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Configuration for CSS Modules with pre-rendering';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;
  let updateAStyleBlockRef;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(function() {
      // JSDOM doesn't support CSS nesting and kind of blows up in the console as it tries to parse it automatically
      // https://github.com/jsdom/jsdom/issues/2005#issuecomment-2397495853
      updateAStyleBlockRef = implementation.prototype._updateAStyleBlock; // eslint-disable-line no-underscore-dangle
      implementation.prototype._updateAStyleBlock = () => {}; // eslint-disable-line no-underscore-dangle

      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('index.html with expected CSS and SSR contents', function() {
      const EXPECTED_HEADER_CLASS_NAMES = 8;
      const EXPECTED_FOOTER_CLASS_NAMES = 7;
      let dom;
      let headerSourceCss;
      let footerSourceCss;
      let expectedHeaderCss;
      let expectedFooterCss;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        headerSourceCss = await fs.promises.readFile(new URL('./src/components/header/header.module.css', import.meta.url), 'utf-8');
        footerSourceCss = await fs.promises.readFile(new URL('./src/components/footer/footer.module.css', import.meta.url), 'utf-8');
        expectedHeaderCss = await fs.promises.readFile(new URL('./expected.header.css', import.meta.url), 'utf-8');
        expectedFooterCss = await fs.promises.readFile(new URL('./expected.footer.css', import.meta.url), 'utf-8');
      });

      describe('Header component with CSS Modules', () => {
        it('should have the expected scoped CSS inlined in a <style> tag', () => {
          const styles = dom.window.document.querySelectorAll('head style');
          const styleText = styles[0].textContent;
          let scopedHash;

          expect(styles.length).to.equal(1);

          const ast = parse(styleText, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node) {
              const { type, name } = node;

              if (type === 'ClassSelector' && name.startsWith('header') && !scopedHash) {
                scopedHash = name.split('-')[1];
              }
            }
          });

          expect(styleText).to.contain(expectedHeaderCss.replace(/\[placeholder\]/g, scopedHash));
        });

        it('should have the source <app-header> CSS class names as scoped class names inlined in a <style> tag', () => {
          const styles = dom.window.document.querySelectorAll('head style');
          const styleText = styles[0].textContent;
          let classes = [];

          const ast = parse(headerSourceCss, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node, item) {
              const { type, name } = node;
              if (type === 'ClassSelector' && item.prev === null) {
                const scopedClassNameRegex = new RegExp(String.raw`.header-\d+-${name}`, 'g');

                classes.push(name);
                expect(styleText).to.match(scopedClassNameRegex);
              }
            }
          });

          expect(classes.length).to.equal(EXPECTED_HEADER_CLASS_NAMES);
          expect(styleText).not.to.contain('undefined');
        });

        it('should have the source <app-header> CSS class names as scoped class names output in the SSR\'d HTML', () => {
          const bodyHtml = dom.window.document.querySelector('body').innerHTML;
          let classes = [];

          const ast = parse(headerSourceCss, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node) {
              const { type, name } = node;
              if (type === 'ClassSelector') {
                const scopedClassNameRegex = new RegExp(String.raw`.header-\d+-${name}`, 'g');

                classes.push(name);
                expect(bodyHtml).to.match(scopedClassNameRegex);
              }
            }
          });

          expect(classes.length).to.equal(EXPECTED_HEADER_CLASS_NAMES);
          expect(bodyHtml).not.to.contain('undefined');
        });

        describe('JavaScript bundling referencing a CSS Module', function() {
          let bundles;
          let modules;
          let contents;

          before(async function() {
            bundles = glob.sync(path.join(this.context.publicDir, 'header*.*.js'));
            modules = glob.sync(path.join(this.context.publicDir, 'header*.css'));
            contents = fs.readFileSync(bundles[0], 'utf-8');
          });

          it('should only emit one <app-header> bundle', () => {
            expect(bundles.length).to.equal(1);
          });

          it('should NOT emit a module.css file', () => {
            expect(modules.length).to.equal(0);
          });

          it('should not have any references to CSS modules in the JavaScript bundle', function() {
            expect(contents).to.not.contain('from"/header.module');
          });

          it('should have transformed class names in the JavaScript bundle', function() {
            const styles = dom.window.document.querySelectorAll('head style');
            const styleText = styles[0].textContent;
            let classes = [];

            const ast = parse(styleText, {
              onParseError(error) {
                console.log(error.formattedMessage);
              }
            });

            walk(ast, {
              enter: function (node) {
                const { type, name } = node;
                if (type === 'ClassSelector' && name.startsWith('header')) {
                  const scopedClassNameRegex = new RegExp(String.raw`class="${name}"`, 'g');

                  classes.push(name);
                  expect(contents).to.match(scopedClassNameRegex);
                }
              }
            });

            expect(classes.length).to.equal(EXPECTED_HEADER_CLASS_NAMES);
          });

          it('should not have any references to \'undefined\' in the JavaScript bundle', function() {
            expect(contents).to.not.contain('undefined');
          });
        });
      });

      describe('Footer component with CSS Modules', () => {
        it('should have the expected scoped CSS inlined in a <style> tag', () => {
          const styles = dom.window.document.querySelectorAll('head style');
          const styleText = styles[0].textContent;
          let scopedHash;

          expect(styles.length).to.equal(1);

          const ast = parse(styleText, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node) {
              const { type, name } = node;

              if (type === 'ClassSelector' && name.startsWith('footer') && !scopedHash) {
                scopedHash = name.split('-')[1];
              }
            }
          });

          expect(styleText).to.contain(expectedFooterCss.replace(/\[placeholder\]/g, scopedHash));
        });

        it('should have the source <app-header> CSS class names as scoped class names inlined in a <style> tag', () => {
          const styles = dom.window.document.querySelectorAll('head style');
          const styleText = styles[0].textContent;
          let classes = [];

          const ast = parse(footerSourceCss, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node, item) {
              const { type, name } = node;
              if (type === 'ClassSelector' && item.prev === null) {
                const scopedClassNameRegex = new RegExp(String.raw`.footer-\d+-${name}`, 'g');

                classes.push(name);
                expect(styleText).to.match(scopedClassNameRegex);
              }
            }
          });

          expect(classes.length).to.equal(EXPECTED_FOOTER_CLASS_NAMES);
          expect(styleText).not.to.contain('undefined');
        });

        it('should have the source <app-footer> CSS class names as scoped class names output in the SSR\'d HTML', () => {
          const bodyHtml = dom.window.document.querySelector('body').innerHTML;
          let classes = [];

          const ast = parse(footerSourceCss, {
            onParseError(error) {
              console.log(error.formattedMessage);
            }
          });

          walk(ast, {
            enter: function (node, item) {
              const { type, name } = node;
              if (type === 'ClassSelector' && item.prev === null) {
                const scopedClassNameRegex = new RegExp(String.raw`.footer-\d+-${name}`, 'g');

                classes.push(name);
                expect(bodyHtml).to.match(scopedClassNameRegex);
              }
            }
          });

          expect(classes.length).to.equal(EXPECTED_FOOTER_CLASS_NAMES);
          expect(bodyHtml).not.to.contain('undefined');
        });

        describe('JavaScript bundling referencing a CSS Module', function() {
          let bundles;
          let modules;
          let contents;

          before(async function() {
            bundles = glob.sync(path.join(this.context.publicDir, 'footer*.*.js'));
            modules = glob.sync(path.join(this.context.publicDir, 'footer*.css'));
            contents = fs.readFileSync(bundles[0], 'utf-8');
          });

          it('should only emit one <app-footer> bundle', () => {
            expect(bundles.length).to.equal(1);
          });

          it('should NOT emit a module.css file', () => {
            expect(modules.length).to.equal(0);
          });

          it('should not have any references to CSS modules in the JavaScript bundle', function() {
            expect(contents).to.not.contain('from"/footer.module');
          });

          it('should have transformed class names in the JavaScript bundle', function() {
            const styles = dom.window.document.querySelectorAll('head style');
            const styleText = styles[0].textContent;
            let classes = [];

            const ast = parse(styleText, {
              onParseError(error) {
                console.log(error.formattedMessage);
              }
            });

            walk(ast, {
              enter: function (node) {
                const { type, name } = node;
                if (type === 'ClassSelector' && name.startsWith('footer')) {
                  const scopedClassNameRegex = new RegExp(String.raw`class="${name}"`, 'g');

                  classes.push(name);
                  expect(contents).to.match(scopedClassNameRegex);
                }
              }
            });

            expect(classes.length).to.equal(EXPECTED_FOOTER_CLASS_NAMES);
          });

          it('should not have any references to \'undefined\' in the JavaScript bundle', function() {
            expect(contents).to.not.contain('undefined');
          });
        });
      });

      describe('Logo component nested in <app-header> component', () => {
        it('should have the expected logo CSS inlined into the style tag', () => {
          const styles = dom.window.document.querySelectorAll('head style');
          const styleText = styles[0].textContent;
          const expectedStyles = '.logo-1501575137-container{display:flex}.logo-1501575137-logo{display:inline-block;width:100%;}';

          expect(styleText).to.contain(expectedStyles);
        });

        it('should have the expected logo CSS class names in the HTML', () => {
          const classNames = ['logo-1501575137-container', 'logo-1501575137-logo'];
          const bodyHtml = dom.window.document.querySelector('body').innerHTML;

          classNames.forEach((name) => {
            expect(bodyHtml).to.contain(`class="${name}"`);
          });
        });
      });
    });
  });

  after(function() {
    implementation.prototype._updateAStyleBlock = updateAStyleBlockRef; // eslint-disable-line no-underscore-dangle

    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});