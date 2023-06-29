/*
 * Use Case
 * Run Greenwood with staticRouter setting in Greenwood to enable SPA like routing.
 *
 * User Result
 * Should serve a bare bones Greenwood build with support for static router navigation and SSR routes
 * to support hybrid workspaces.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   staticRouter: true
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     about.md
 *     artists.js
 *     index.md
 */
import chai from 'chai';
import fs from 'fs/promises';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { normalizePathnameForWindows } from '../../../src/lib/resource-utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Static Router Configuration and Hybrid Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    const workaroundFiles = [
      'hashing-utils',
      'node-modules-utils',
      'resource-utils',
      'templating-utils'
    ];

    before(async function() {
      const greenwoodRouterLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/router.js`,
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );
      /*
       * there is an odd issue seemingly due to needed lib/router.js tha causes tests to think files are CommonJS
       * ```
       * file:///Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/packages/cli/test/cases/serve.config.static-router/public/artists.js:3
       * import { getAppTemplate, getPageTemplate, getUserScripts } from '@greenwood/cli/src/lib/templating-utils.js';
       *         ^^^^^^^^^^^^^^
       * SyntaxError: Named export 'getAppTemplate' not found. The requested module '@greenwood/cli/src/lib/templating-utils.js'
       * is a CommonJS module, which may not support all module.exports as named exports.
       * CommonJS modules can always be imported via the default export, for example using:
       * import pkg from '@greenwood/cli/src/lib/templating-utils.js';
       * const { getAppTemplate, getPageTemplate, getUserScripts } = pkg;
       * ```
       *
       * however no other tests have this issue.  so as terrible hack we need to
       * - copy all lib files
       * - rename them to end in .mjs
       * - update references to these files in other imports
       *
       *  (unfortunately, trying to just add a package.json with type="module" did not seem to work :/)
       */
      const greenwoodTemplatingLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/*`,
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );
      const greenwoodTemplates = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/templates/*`,
        `${outputPath}/node_modules/@greenwood/cli/src/templates`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs,
        ...greenwoodTemplatingLibs,
        ...greenwoodTemplates
      ]);

      for (const f of workaroundFiles) {
        const pathname = normalizePathnameForWindows(new URL(`./node_modules/@greenwood/cli/src/lib/${f}.js`, import.meta.url));
        let contents = await fs.readFile(pathname, 'utf-8');

        workaroundFiles.forEach((wf) => {
          contents = contents.replace(`${wf}.js`, `${wf}.mjs`);
        });

        await fs.writeFile(pathname.replace('.js', '.mjs'), contents);
      }

      await runner.runCommand(cliPath, 'build');

      return new Promise(async (resolve) => {
        setTimeout(async () => {
          // template out artists.js to use .mjs too
          const pathname = normalizePathnameForWindows(new URL('./public/artists.js', import.meta.url));
          let ssrPageContents = await fs.readFile(pathname, 'utf-8');

          for (const f of workaroundFiles) {
            ssrPageContents = ssrPageContents.replace(`${f}.js`, `${f}.mjs`);
          }

          await fs.writeFile(pathname, ssrPageContents);

          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Serve command with SSR route with staticRouter config set', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/artists/`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('<h2>Analog</h2>');
        expect(response.body).to.contain('<img src="/assets/analog.png" alt="Analog"/>');
        done();
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});