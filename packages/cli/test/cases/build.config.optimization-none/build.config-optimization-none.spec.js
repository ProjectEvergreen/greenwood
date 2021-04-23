/*
 * Use Case
 * Run Greenwood build command with none setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that does not optimize any <script> and <link> tags
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'none'
 * }
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
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'None Optimization Configuration';
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
      let cssFiles;
      let jsFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        jsFiles = await glob.promise(path.join(this.context.publicDir, '*.js'));
        cssFiles = await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`);
      });

      it('should contain no <link> preload tags in the <head>', function() {
        const preloadTags = dom.window.document.querySelectorAll('head link[rel="preload"]');

        expect(preloadTags.length).to.be.equal(0);
      });
      
      describe('<script> tag and preloading', function() {
        it('should contain one unminifed javasccript file in the output directory', async function() {
          expect(jsFiles).to.have.lengthOf(1);
        });

        it('should output the contents of the JavaScript file unminified', function() {
          const js = fs.readFileSync(jsFiles[0], 'utf-8');

          // eslint-disable-next-line max-len
          expect(js).to.be.contain('class HeaderComponent extends HTMLElement {\n  constructor() {\n    super();\n\n    this.root = this.attachShadow({ mode: \'open\' });\n    this.root.innerHTML = `\n      <header>This is the header component.</header>\n    `;\n  }\n}\n\ncustomElements.define(\'app-header\', HeaderComponent);\n');
        });

        it('should have the expected <script> tag in the <head>', function() {
          const scriptTags = dom.window.document.querySelectorAll('head script');

          expect(scriptTags.length).to.be.equal(1);
        });

        it('should contain the expected content from <app-header> in the <body>', function() {
          const header = dom.window.document.querySelectorAll('body header');

          expect(header.length).to.be.equal(1);
          expect(header[0].textContent).to.be.equal('This is the header component.');
        });
      });

      describe('<link> tags should not be preloaded', function() {
        it('should contain one style.css in the output directory with unminifed content', async function() {
          expect(cssFiles).to.have.lengthOf(1);
        });

        it('should output the contents of the CSS file unminified', function() {
          const css = fs.readFileSync(cssFiles[0], 'utf-8');
          
          expect(css).to.be.contain('{\n  margin: 0;\n  padding: 0;\n  font-family: \'Comic Sans\', sans-serif;\n}');
        });

        it('should have only one expected <link> tag in the <head>', function() {
          const linkTags = dom.window.document.querySelectorAll('head link');

          expect(linkTags.length).to.be.equal(1);
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});