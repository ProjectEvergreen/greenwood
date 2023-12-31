/*
 * Use Case
 * Run Greenwood build command with inline setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that inlines all JS and CSS <script> and <link> tags.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'inline'
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     foobar.js
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     color.css
 *     theme.css
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
  const LABEL = 'Inline Optimization Configuration';
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

    describe('Output for JavaScript / CSS tags and files', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no link <tags> in the <head> tag', function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(0);
      });

      describe('<script> tags and files', function() {
        it('should contain three <script> tags in the <head>', function() {
          const allScriptTags = Array.from(dom.window.document.querySelectorAll('head script')).filter(tag => !tag.getAttribute('data-gwd'));

          expect(allScriptTags.length).to.be.equal(3);
        });

        it('should contain no <script> tags in the <head> with a src', function() {
          const allSrcScriptTags = dom.window.document.querySelectorAll('head script[src]');

          expect(allSrcScriptTags.length).to.be.equal(0);
        });

        it('should contain no Javascript files in the output directory', async function() {
          const jsFiles = await glob.promise(`${this.context.publicDir}**/**/*.js`);

          expect(jsFiles).to.have.lengthOf(0);
        });
      });

      // assume the first tag is for the header
      describe('Header', function() {
        it('should contain one <script> tag with the expected JS content inlined of type="module" for the header', function() {
          const scriptTag = Array.from(dom.window.document.querySelectorAll('head script')).filter(tag => !tag.getAttribute('data-gwd'))[0];

          expect(scriptTag.type).to.be.equal('module');
          // eslint-disable-next-line max-len
          expect(scriptTag.textContent).to.contain('class e extends HTMLElement{constructor(){super(),this.root=this.attachShadow({mode:"open"}),this.root.innerHTML="\\n      <header>This is the header component.</header>\\n    "}}customElements.define("app-header",e);');
        });
      });

      // assume the second tag is for FooBar
      // https://github.com/ProjectEvergreen/greenwood/issues/656
      describe('Foobar', function() {
        it('should contain one <script> tag with the expected JS content inlined of type="module" for FooBar', function() {
          const scriptTag = Array.from(dom.window.document.querySelectorAll('head script')).filter(tag => !tag.getAttribute('data-gwd'))[1];

          expect(scriptTag.type).to.be.equal('module');
          // eslint-disable-next-line max-len
          expect(scriptTag.textContent).to.contain('class t extends HTMLElement{constructor(){super(),this.list=[]}find(t){this.list.findIndex((e=>new RegExp(`^${t}$`).test(e.route)))}}export{t as Foobar};');
        });
      });

      // assume the third tag is for Baz
      // https://github.com/ProjectEvergreen/greenwood/issues/656
      describe('Baz', function() {
        it('should contain one <script> tag with the expected JS content for the already inlined of type="module" for Baz', function() {
          const scriptTag = Array.from(dom.window.document.querySelectorAll('head script')).filter(tag => !tag.getAttribute('data-gwd'))[2];

          expect(scriptTag.type).to.be.equal('module');
          // eslint-disable-next-line max-len
          expect(scriptTag.textContent).to.contain('class t extends HTMLElement{constructor(){super(),this.list=[]}find(t){this.list.findIndex((e=>new RegExp(`^${t}$`).test(e.route)))}}export{t as Baz};');
        });
      });

      describe('<link> tags as <style> tags and file output', function() {
        it('should contain no CSS files in the output directory', async function() {
          const cssFiles = await glob.promise(`${this.context.publicDir}**/**/*.css`);

          expect(cssFiles).to.have.lengthOf(0);
        });

        it('should contain two <style> tags with the expected CSS content inlined for theme.css and pages.css', function() {
          const styleTags = dom.window.document.querySelectorAll('head style');

          expect(styleTags.length).to.be.equal(2);
        });

        it('should contain the expected CSS content inlined for theme.css', function() {
          const styleTags = dom.window.document.querySelectorAll('head style');

          expect(styleTags[0].textContent).to.contain('*{margin:0;padding:0;font-family:\'Comic Sans\',sans-serif;}');
        });

        it('should contain the expected CSS content inlined for page.css', function() {
          const styleTags = dom.window.document.querySelectorAll('head style');

          expect(styleTags[1].textContent).to.contain('body{color:red}');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});