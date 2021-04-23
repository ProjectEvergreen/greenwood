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
 * markdown: {
 *   plugins: [
 *     '@mapbox/rehype-prism',
 *     'rehype-slug',
 *     'rehype-autolink-headings'
 *   ]
 * }
 *
 * User Workspace
 * Greenwood default
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Markdown Configuration and Default Workspace';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom Markdown Plugins', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should use our custom rehype plugin to add syntax highlighting', function() {
        let pre = dom.window.document.querySelectorAll('body pre');
        let code = dom.window.document.querySelectorAll('body pre code');

        expect(pre.length).to.equal(1);
        expect(pre[0].getAttribute('class')).to.equal('language-js');
        
        expect(code.length).to.equal(1);
        expect(code[0].getAttribute('class')).to.equal('language-js');
      });

      it('should use our custom markdown preset rehype-autolink-headings and rehype-slug plugins', function() {
        let heading = dom.window.document.querySelector('h1 > a');
        
        expect(heading.getAttribute('href')).to.equal('#greenwood-markdown-syntax-highlighting-test');
      });

      it('should use our custom markdown preset rremark-TBD plugins', function() {
        let heading = dom.window.document.querySelector('h3 > a');
        
        expect(heading.getAttribute('href')).to.equal('#lower-heading-test');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});