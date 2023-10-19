/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and return CSS file as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
 *
 * {
 *   plugins: [{
 *      ...greenwoodPluginImportCss()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   main.css
 *
 */
import chai from 'chai';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';
import { runSmokeTest } from '../../../../../test/smoke-test.js';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import CSS plugin for using ESM with .css files';
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
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific ESM .css behaviors', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`http://localhost:${port}/main.css?type=css`);
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
      it('should return an ECMASCript module', function() {
        expect(data.replace('\n', '').replace(/ /g, '').trim())
          .to.equal('constcss=`*{background-image:url("/assets/background.jpg");font-family:\'Arial\'}.blockquote-footer::before{content:"\\\\2014\\\\00A0";}.fa-chevron-right:before{content:"\\\\f054";}`;exportdefaultcss;'); // eslint-disable-line max-len
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/pull/747
    // https://unpkg.com/browse/@material/mwc-button@0.22.1/styles.css.js
    describe('Develop command specific ESM .css.js files behaviors (CSS in disguise)', function() {
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`http://localhost:${port}/styles.css.js`);
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