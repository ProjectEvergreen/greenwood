/*
 * Use Case
 * Run Greenwood build command with prerender config set to true and using HTML (Light DOM) Web Components.
 *
 * User Result
 * Should generate a Greenwood build with the expected generated output using custom elements.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     index.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import fs from 'fs/promises';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Prerender Configuration and HTML (Light DOM) Web Components';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Prerendered output for index.html', function() {
      let dom;
      let pictureFrame;
      let expectedHtml;
      let actualHtml;

      before(async function() {
        actualHtml = await fs.readFile(new URL('./public/index.html', import.meta.url), 'utf-8');
        dom = new JSDOM(actualHtml);
        pictureFrame = dom.window.document.querySelectorAll('wcc-picture-frame');
        expectedHtml = await fs.readFile(new URL('./expected.html', import.meta.url), 'utf-8');
      });

      describe(LABEL, function() {
        it('should not have any <template> tags within the document', function() {
          expect(dom.window.document.querySelectorAll('template').length).to.equal(0);
        });

        it('should only have one <wcc-picture-frame> tag', function() {
          expect(pictureFrame.length).to.equal(1);
        });

        it('should have the expected image from userland in the HTML', () => {
          const img = pictureFrame[0].querySelectorAll('.picture-frame img');

          expect(img.length).to.equal(1);
          expect(img[0].getAttribute('alt')).to.equal('Greenwood logo');
          expect(img[0].getAttribute('src')).to.equal('https://www.greenwoodjs.io/assets/greenwood-logo-og.png');
        });

        it('should have the expected Author name <span> from userland in the HTML', () => {
          const img = pictureFrame[0].querySelectorAll('.picture-frame img + br + span');

          expect(img.length).to.equal(1);
          expect(img[0].textContent).to.equal('Author: Greenwood');
        });

        it('should have the expected title attribute content in the nested <wcc-caption> tag', () => {
          const caption = pictureFrame[0].querySelectorAll('.picture-frame wcc-caption .caption');
          const heading = caption[0].querySelectorAll('.heading');

          expect(caption.length).to.equal(1);
          expect(heading.length).to.equal(1);
          expect(heading[0].textContent).to.equal('Greenwood');
        });

        it('should have the expected copyright content in the nested <wcc-caption> tag', () => {
          const caption = pictureFrame[0].querySelectorAll('.picture-frame wcc-caption .caption');
          const span = caption[0].querySelectorAll('span');

          expect(span.length).to.equal(1);
          expect(span[0].textContent).to.equal('© 2024');
        });

        it('should have the expected recursively generated HTML', () => {
          const body = dom.window.document.querySelector('body');

          expect(expectedHtml.replace(/ /g, '').replace(/\n/g, '')).to.equal(body.innerHTML.replace(/ /g, '').replace(/\n/g, ''));
        });
      });
    });
  });

  after(async function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});