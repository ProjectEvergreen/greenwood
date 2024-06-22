/*
 * Use Case
 * Run Greenwood serve command with no config for using import attributes with API Routes and SSR pages..
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   components/
 *     card/
 *       card.css
 *       card.js
 *       card.json
 *   pages/
 *     api/
 *       fragment.js
 *     greeting.js
 *
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Import Attributes used in API Routes and SSR Pages';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath);
      runner.runCommand(cliPath, 'build');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'serve', { async: true });
      });
    });

    describe('API Route specific behaviors for an HTML ("fragment") API', function() {
      const name = 'Greenwood';
      let response = {};
      let body;
      let scripts;

      before(async function() {
        response = await fetch(`${hostname}/api/fragment?name=${name}`);
        body = await response.clone().text();
        scripts = await glob.promise(path.join(outputPath, 'public/api/card.*.js'));
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        const dom = new JSDOM(body);
        const card = new JSDOM(dom.window.document.querySelectorAll('app-card template[shadowrootmode="open"]')[0].innerHTML);
        const heading = card.window.document.querySelector('h2');
        const image = card.window.document.querySelector('img');

        expect(heading.textContent).to.equal(`Hello, ${name}!`);
        expect(image.getAttribute('href')).to.equal('/path/to/image.webp');

        done();
      });

      it('should have the expected output from importing hero.css as a Constructable Stylesheet', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('const sheet = new CSSStyleSheet();sheet.replaceSync(`:host {   color: red; }`);');
      });

      it('should have the expected output from importing hero.json', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('var data = {"image":{"url":"/path/to/image.webp"}};');
      });
    });

    describe('SSR route specific behaviors when using a custom element as the page', function() {
      let response = {};
      let body;
      let scripts;

      before(async function() {
        response = await fetch(`${hostname}/greeting/`);
        body = await response.clone().text();
        scripts = await glob.promise(path.join(outputPath, 'public/greeting.route.chunk.*.js'));
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        const dom = new JSDOM(body);
        const card = new JSDOM(dom.window.document.querySelectorAll('app-card template[shadowrootmode="open"]')[0].innerHTML);
        const heading = card.window.document.querySelector('h2');
        const image = card.window.document.querySelector('img');

        expect(heading.textContent).to.equal('Hello, World!');
        expect(image.getAttribute('href')).to.equal('/path/to/image.webp');

        done();
      });

      it('should have the expected output from importing hero.css as a Constructable Stylesheet', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('const sheet = new CSSStyleSheet();sheet.replaceSync(`:host {   color: red; }`);');
      });

      it('should have the expected output from importing hero.json', function() {
        const scriptContents = fs.readFileSync(scripts[0], 'utf-8');

        expect(scriptContents).to.contain('var data = {"image":{"url":"/path/to/image.webp"}};');
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'node_modules')
    ]);
  });
});