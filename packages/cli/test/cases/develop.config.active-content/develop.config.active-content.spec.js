/*
 * Use Case
 * Run Greenwood develop command using various content as data APIs.
 *
 * User Result
 * Should start the dev server with the expected generated output using custom elements.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   activeContent: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *    blog-posts-lists.js
 *    header.js
 *    toc.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *       index.html
 *     contact.html
 *     index.html
 *     toc.html
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Active Content';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath, [
        ...getSetupFiles(outputPath)
      ]);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Data Client Import Map', () => {
      let response;
      let dom;

      before(async function() {
        response = await fetch(`${hostname}:${port}/`);
        dom = new JSDOM(await response.text());
      });

      it('should have a <script> tag of type importmap', async () => {
        const map = dom.window.document.querySelectorAll('script[type="importmap"]');

        expect(map.length).to.equal(1);
      });

      it('should have the expected entry in the importmap', async () => {
        const map = dom.window.document.querySelectorAll('script[type="importmap"]');
        const contents = JSON.parse(map[0].textContent);

        expect(contents.imports['@greenwood/cli/src/data/client.js']).to.equal('/node_modules/@greenwood/cli/src/data/client.js');
      });
    });

    describe('Content Request Types', () => {
      describe('Graph Request', () => {
        let response;

        before(async function() {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            method: 'GET',
            headers: {
              'x-content-key': 'graph'
            }
          });
        });

        it('should have the expected content response data', async () => {
          const data = await response.json();

          expect(data.length).to.equal(7);
        });
      });

      describe('Route Request', () => {
        let response;

        before(async function() {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            headers: {
              'x-content-key': 'route-/blog'
            }
          });
        });

        it('should have the expected content response data', async () => {
          const data = await response.json();

          expect(data.length).to.equal(3);
        });
      });

      describe('Collections Request', () => {
        let response;

        before(async function() {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            headers: {
              'x-content-key': 'collection-nav'
            }
          });
        });

        it('should have the expected content response data', async () => {
          const data = await response.json();

          expect(data.length).to.equal(4);
        });
      });
    });
  });

  after(async function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});