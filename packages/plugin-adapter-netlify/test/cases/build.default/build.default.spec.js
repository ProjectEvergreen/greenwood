/*
 * Use Case
 * Run Greenwood with the Netlify adapter plugin.
 *
 * User Result
 * Should generate a static Greenwood build with serverless and edge functions output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterNetlify } from '@greenwood/plugin-adapter-netlify';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginAdapterNetlify()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     card.js
 *   pages/
 *     artists.js
 *   services/
 *     artists.js
 *     greeting.js
 */
import chai from 'chai';
import glob from 'glob-promise';
// import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';
import extract from 'extract-zip';

const expect = chai.expect;

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Netlify Adapter plugin output';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const netlifyFunctionsOutputUrl = new URL('./netlify/functions/', import.meta.url);
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(true);
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    describe('Default Output', function() {
      let zipFiles;

      before(async function() {
        zipFiles = await glob.promise(path.join(netlifyFunctionsOutputUrl.pathname, '*.zip'));
      });

      it('should output two serverless function zip files', function() {
        expect(zipFiles.length).to.be.equal(2);
      });
    });

    describe('Greeting API Route adapter', function() {
      let apiFunctions;

      before(async function() {
        apiFunctions = await glob.promise(path.join(netlifyFunctionsOutputUrl.pathname, 'api-*.zip'));
      });

      it('should output one API route as a serverless function zip file', function() {
        expect(apiFunctions.length).to.be.equal(1);
      });

      it('should return the expected response the serverless adapter entry point handler is invoked', async function() {
        const param = 'Greenwood';
        const name = path.basename(apiFunctions[0]).replace('.zip', '');

        await extract(apiFunctions[0], {
          dir: path.join(netlifyFunctionsOutputUrl.pathname, name)
        });
        const { handler } = await import(new URL(`./${name}/${name}.js`, netlifyFunctionsOutputUrl));
        const response = await handler({
          rawUrl: `http://localhost:8080/api/${name}?name=${param}`
        }, {});
        const { statusCode, body } = response;

        expect(statusCode).to.be.equal(200);
        expect(JSON.parse(body).message).to.be.equal(`Hello ${param}!`);
      });
    });

    describe('Artists SSR Page adapter', function() {
      // let dom;
      // let scripts;

      // before(async function() {
      //   scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
      //   dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      // });

      // it('should contain one bundled output file in the output directory', function() {
      //   expect(scripts.length).to.be.equal(1);
      // });

      // it('should have the expected <script> tag in the <head> for the <app-footer> component', function() {
      //   const scripts = dom.window.document.querySelectorAll('head > script');

      //   expect(scripts.length).to.equal(1);
      // });
    });
  });

  after(function() {
    runner.teardown([
      path.join(outputPath, 'netlify'),
      ...getOutputTeardownFiles(outputPath)
    ]);
  });

});