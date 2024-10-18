/*
 * Use Case
 * Run Greenwood develop command with no raw plugin.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and return CSS file as a string using ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportRaw()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   main.css
 *   style.css.js
 *
 */
import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import { runSmokeTest } from '../../../../../test/smoke-test.js';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import Raw plugin for using ESM with arbitrary files as strings';
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
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command with raw ESM behaviors with CSS', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}:${port}/main.css?type=raw`);
        data = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/javascript');
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/766
      // https://unpkg.com/browse/bootstrap@4.6.1/dist/css/bootstrap.css
      // https://unpkg.com/browse/font-awesome@4.7.0/css/font-awesome.css
      // TODO looks like this use case is "broken" within csstree
      // https://github.com/csstree/csstree/issues/179
      xit('should return an ECMASCript module', function() {
        expect(data.replace('\n', '').replace(/ /g, '').trim())
          .to.equal('constraw=`*{background-image:url(\'/assets/background.jpg\');font-family:\'Arial\';}.blockquote-footer::before{content:"\\\\2014\\\\00A0";}.fa-chevron-right:before{content:"\\\\f054";}`;exportdefaultraw;'); // eslint-disable-line max-len
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/pull/747
    // https://unpkg.com/browse/@material/mwc-button@0.22.1/styles.css.js
    describe('Develop command for .css.js files behaviors (CSS in disguise)', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}:${port}/styles.css.js`);
        data = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/javascript');
      });

      it('should return an ECMASCript module', function() {
        expect(data).to.equal('export const styles = css `.mdc-touch-target-wrapper{display:inline}`;');
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });
});