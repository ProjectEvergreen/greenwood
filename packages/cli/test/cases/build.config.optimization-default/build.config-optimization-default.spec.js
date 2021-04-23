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
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Optimization Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
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
  
    describe('Output for JavaScript / CSS tags and files', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      describe('<script> tag and preloading', function() {
        it('should contain one javasccript file in the output directory', async function() {
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

        it('should contain the expected content from <app-header> in the <body>', function() {
          const header = dom.window.document.querySelectorAll('body header');

          expect(header.length).to.be.equal(1);
          expect(header[0].textContent).to.be.equal('This is the header component.');
        });
      });

      describe('<link> tag and preloading', function() {
        it('should contain one style.css in the output directory', async function() {
          expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`)).to.have.lengthOf(1);
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
          expect(preloadLinkTags[0].href).to.match(/\/styles\/theme.*.css/);
          expect(preloadLinkTags[0].getAttribute('crossorigin')).to.equal('anonymous');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});