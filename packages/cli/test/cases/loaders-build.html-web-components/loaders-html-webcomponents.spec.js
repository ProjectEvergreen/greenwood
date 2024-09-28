/*
 * Use Case
 * Run Greenwood and correctly prerender "HTML" Web Components.
 *
 * User Result
 * Should generate a static Greenwood build with the expected prerender "HTML" Web Components content.
 *
 * User Command
 * greenwood build
 *
 * User Config
 *
 * {
 *   prerender: true,
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     picture-frame.js
*    index.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Prerendering with HTML Web Components';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {
    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('Prerender HTML Web Component', function() {
      let dom;
      let pictureFrame;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        pictureFrame = dom.window.document.querySelectorAll('app-picture-frame');
      });

      it('should not have any <template> tags within the document', function() {
        expect(dom.window.document.querySelectorAll('template').length).to.equal(0);
      });
  
      it('should only have one <app-picture-frame> tag', function() {
        expect(pictureFrame.length).to.equal(1);
      });
  
      it('should have the expected title attribute content in the heading of HTML', () => {
        const heading = pictureFrame[0].querySelectorAll('.picture-frame .heading');
  
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Greenwood');
      });
  
      it('should have the expected image from userland in the HTML', () => {
        const img = pictureFrame[0].querySelectorAll('.picture-frame img');
  
        expect(img.length).to.equal(1);
        expect(img[0].getAttribute('alt')).to.equal('Greenwood logo');
        expect(img[0].getAttribute('src')).to.equal('/assets/greenwood.png');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});