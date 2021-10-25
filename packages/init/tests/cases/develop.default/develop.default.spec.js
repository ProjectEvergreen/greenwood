/*
 * Use Case
 * Scaffold from minimal template and run Greenwood develop command with no config.
 *
 * User Result
 * Should scaffold from template and start the development server and render the template.
 *
 * User Command
 * @greenwood/init
 * greenwood develop
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 * greenwood.config.js
 * package.json
 */
const expect = require('chai').expect;
// const { JSDOM } = require('jsdom');
const path = require('path');
const { getDependencyFiles, getSetupFiles } = require('../../../../../test/utils');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Scaffold Greenwood With: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('default minimal template', function () {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(initPath);
    });

    describe('Develop Greenwood With: ', function() {
      const LABEL = 'Default Greenwood Configuration and Workspace';
      const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
      const outputPath = __dirname;
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
          const lit = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit/*.js`,
            `${outputPath}/node_modules/lit/`
          );
          const litDecorators = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit/decorators/*.js`,
            `${outputPath}/node_modules/lit/decorators/`
          );
          const litDirectives = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit/directives/*.js`,
            `${outputPath}/node_modules/lit/directives/`
          );
          const litPackageJson = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit/package.json`,
            `${outputPath}/node_modules/lit/`
          );
          const litElement = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-element/*.js`,
            `${outputPath}/node_modules/lit-element/`
          );
          const litElementPackageJson = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-element/package.json`,
            `${outputPath}/node_modules/lit-element/`
          );
          const litElementDecorators = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-element/decorators/*.js`,
            `${outputPath}/node_modules/lit-element/decorators/`
          );
          const litHtml = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-html/*.js`,
            `${outputPath}/node_modules/lit-html/`
          );
          const litHtmlPackageJson = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-html/package.json`,
            `${outputPath}/node_modules/lit-html/`
          );
          const litHtmlDirectives = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-html/directives/*.js`,
            `${outputPath}/node_modules/lit-html/directives/`
          );
          const litReactiveElement = await getDependencyFiles(
            `${process.cwd()}/node_modules/@lit/reactive-element/*.js`,
            `${outputPath}/node_modules/@lit/reactive-element/`
          );
          const litReactiveElementDecorators = await getDependencyFiles(
            `${process.cwd()}/node_modules/@lit/reactive-element/decorators/*.js`,
            `${outputPath}/node_modules/@lit/reactive-element/decorators/`
          );
          const litReactiveElementPackageJson = await getDependencyFiles(
            `${process.cwd()}/node_modules/@lit/reactive-element/package.json`,
            `${outputPath}/node_modules/@lit/reactive-element/`
          );
          const litHtmlSourceMap = await getDependencyFiles(
            `${process.cwd()}/node_modules/lit-html/lit-html.js.map`,
            `${outputPath}/node_modules/lit-html/`
          );

          await runner.setup(outputPath, [
            ...getSetupFiles(outputPath),
            ...lit,
            ...litPackageJson,
            ...litDirectives,
            ...litDecorators,
            ...litElementPackageJson,
            ...litElement,
            ...litElementDecorators,
            ...litHtmlPackageJson,
            ...litHtml,
            ...litHtmlDirectives,
            ...litReactiveElement,
            ...litReactiveElementDecorators,
            ...litReactiveElementPackageJson,
            ...litHtmlSourceMap
          ]);

          return new Promise(async (resolve) => {
            setTimeout(() => {
              resolve();
            }, 5000);

            await runner.runCommand(cliPath, 'develop');
          });
        });

        runSmokeTest(['serve'], LABEL);

        describe('Develop command specific HTML behaviors', function() {
          let response = {};
          // let dom;

          before(async function() {
            return new Promise((resolve, reject) => {
              request.get({
                url: `http://127.0.0.1:${port}`,
                headers: {
                  accept: 'text/html'
                }
              }, (err, res) => {
                if (err) {
                  reject();
                }

                response = res;
                
                // dom = new JSDOM(body);
                resolve();
              });
            });
          });

          it('should return the correct content type', function(done) {
            expect(response.headers['content-type']).to.contain('text/html');
            done();
          });

          it('should return a 200', function(done) {
            expect(response.statusCode).to.equal(200);

            done();
          });
        });

        after(function() {
          runner.stopCommand();
          runner.teardown([
            path.join(outputPath, '.greenwood'),
            path.join(outputPath, 'node_modules'),
            path.join(outputPath, 'src'),
            path.join(outputPath, 'greenwood.config.js'),
            path.join(outputPath, 'package-lock.json'),
            path.join(outputPath, 'package.json'),
            path.join(outputPath, '.gitignore')
          ]);
        });
      });
    });
  });
});