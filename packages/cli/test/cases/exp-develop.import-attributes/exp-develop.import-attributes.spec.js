/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   api/
 *     fragment.js
 *   components/
 *     card/
 *       card.css
 *       card.js
 *       card.json
 *   pages/
 *     greeting.js
 *
 * package.json
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import Attributes used in API Routes and SSR Pages';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:1984';
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Develop command with API Route specific behaviors for an HTML ("fragment") API', function() {
      const name = 'Greenwood';
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/api/fragment?name=${name}`);
        body = await response.clone().text();
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
    });

    describe('Develop command with SSR route specific behaviors when using a custom element as the page', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/greeting/`);
        body = await response.clone().text();
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