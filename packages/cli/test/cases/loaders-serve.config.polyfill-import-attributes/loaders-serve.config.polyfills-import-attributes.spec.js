/*
 * Use Case
 * Run Greenwood serve command with import attributes polyfill flag enabled.
 *
 * User Result
 * Should start the production server and have all the expected import attributes polyfill behaviors..
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   prerender: true,
 *   polyfill: {
 *     importAttributes: ['css', 'json']
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero.js
 *     hero.css
 *     hero.json
 *   index.html
 *   theme.css
 * greenwood.config.js
 * package.json
 *
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles, getDependencyFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Import Attributes Polyfill Configuration and prerendering';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputUrl = new URL('.', import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      const greenwoodRouterLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/router.js`,
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs
      ]);
      runner.runCommand(cliPath, 'build');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'serve', { async: true });
      });
    });

    describe('Import Attributes Polyfill Behaviors when used for pre-rendering and returning HTML', function() {
      let response;
      let dom;

      before(async function() {
        response = await fetch(`${hostname}/`);
        dom = new JSDOM(await response.text());
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should have the expected SSR output in the HTML for an <h2> tag from JSON import', function(done) {
        const hero = new JSDOM(dom.window.document.querySelectorAll('app-hero template[shadowrootmode="open"]')[0].innerHTML);
        const headings = hero.window.document.querySelectorAll('div h2');

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal('Hello World');

        done();
      });

      it('should have the expected SSR output in the HTML for <a> tags', function(done) {
        const hero = new JSDOM(dom.window.document.querySelectorAll('app-hero template[shadowrootmode="open"]')[0].innerHTML);
        const links = hero.window.document.querySelectorAll('div a');

        expect(links.length).to.equal(2);
        expect(links[0].getAttribute('href')).to.equal('/get-started');
        expect(links[1].getAttribute('href')).to.equal('/learn-more');

        done();
      });
    });

    describe('Import Attributes Polyfill Behaviors for the initiating JavaScript file (hero.js) being served and bundled', function() {
      const jsHash = '9acf7b4c';
      let response = {};
      let text;
      let contents;

      before(async function() {
        response = await fetch(`${hostname}/hero.${jsHash}.js`);
        text = await response.clone().text();
        contents = await fs.promises.readFile(new URL(`./public/hero.${jsHash}.js`, outputUrl), 'utf-8');
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should not contain import attributes syntax in the response or bundled output', function(done) {
        expect(text.replace(/ /g, '')).to.not.contain('with{type:');
        expect(contents.replace(/ /g, '')).to.not.contain('with{type:');

        done();
      });

      it('should contain import attributes polyfill syntax for the theme CSS', function(done) {
        expect(text).to.contain('const t=new CSSStyleSheet;t.replaceSync("a{color:blue}");');
        expect(contents).to.contain('const t=new CSSStyleSheet;t.replaceSync("a{color:blue}");');

        done();
      });

      it('should contain import attributes polyfill syntax for the component CSS', function(done) {
        expect(text).to.contain('const e=new CSSStyleSheet;e.replaceSync(":host h2{font-size:3em}");');
        expect(contents).to.contain('const e=new CSSStyleSheet;e.replaceSync(":host h2{font-size:3em}");');

        done();
      });

      it('should contain import attributes polyfill syntax for JSON', function(done) {
        expect(text).to.contain('var n="Hello World";');
        expect(contents).to.contain('var n="Hello World";');

        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});