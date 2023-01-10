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
 * devServer: {
 *   proxy: {
 *     '/post': 'https://jsonplaceholder.typicode.com'
 *   }
 * }
 *
 * User Workspace
 * src/
 *   api/
 *     greeting.js
 *   assets/
 *     data.json
 *     favicon.ico
 *     fox.avif
 *     logo.png
 *     river-valley.webp
 *     source-sans-pro.woff
 *     webcomponents.svg
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 * package.json
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getDependencyFiles, getSetupFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

async function rreaddir (dir, allFiles = []) {
  const files = (await fs.promises.readdir(dir)).map(f => path.join(dir, f));

  allFiles.push(...files);

  await Promise.all(files.map(async f => (
    await fs.promises.stat(f)).isDirectory() && rreaddir(f, allFiles
  )));

  return allFiles;
}

// https://stackoverflow.com/a/30405105/417806
async function copyFile(source, target) {
  const rd = fs.createReadStream(source);
  const wr = fs.createWriteStream(target);

  try {
    return await new Promise((resolve, reject) => {
      rd.on('error', reject);
      wr.on('error', reject);
      wr.on('finish', resolve);
      rd.pipe(wr);
    });
  } catch (error) {
    console.error('ERROR', error);
    rd.destroy();
    wr.end();
  }
}

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
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
      const simpleCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/simple.css`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const simpleCssPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/package.json`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const lionButtonLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/button/*.js`,
        `${outputPath}/node_modules/@lion/button/`
      );
      const lionButtonLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/button/package.json`,
        `${outputPath}/node_modules/@lion/button/`
      );
      const lionCoreTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/core/test-helpers/`
      );
      const lionCoreSrcLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/src/*.js`,
        `${outputPath}/node_modules/@lion/core/src/`
      );
      const lionCoreLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/*.js`,
        `${outputPath}/node_modules/@lion/core/`
      );
      const lionCoreLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/core/package.json`,
        `${outputPath}/node_modules/@lion/core/`
      );
      const lionCalendarLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/*.js`,
        `${outputPath}/node_modules/@lion/calendar/`
      );
      const lionCalendarLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/package.json`,
        `${outputPath}/node_modules/@lion/calendar/`
      );
      const lionCalendarTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/calendar/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/calendar/test-helpers/`
      );
      const lionLocalizeLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/*.js`,
        `${outputPath}/node_modules/@lion/localize/`
      );
      const lionLocalizeLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/package.json`,
        `${outputPath}/node_modules/@lion/localize/`
      );
      const lionLocalizeTesterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/test-helpers/*.js`,
        `${outputPath}/node_modules/@lion/localize/test-helpers/`
      );
      const lionLocalizeSrcLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lion/localize/src/*.js`,
        `${outputPath}/node_modules/@lion/localize/src/`
      );
      const owcDepupLibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@open-wc/dedupe-mixin/package.json`,
        `${outputPath}/node_modules/@open-wc/dedupe-mixin/`
      );
      const owcScopedLibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@open-wc/scoped-elements/package.json`,
        `${outputPath}/node_modules/@open-wc/scoped-elements/`
      );
      const messageFormatLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@bundled-es-modules/message-format/*.js`,
        `${outputPath}/node_modules/@bundled-es-modules/message-format/`
      );
      const messageFormatLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@bundled-es-modules/message-format/package.json`,
        `${outputPath}/node_modules/@bundled-es-modules/message-format/`
      );
      const singletonManagerLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/singleton-manager/index.js`,
        `${outputPath}/node_modules/singleton-manager/`
      );
      const singletonManagerLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/singleton-manager/package.json`,
        `${outputPath}/node_modules/singleton-manager/`
      );
      const trustedTypesPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
      );
      const scopedCustomElementRegistryPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@webcomponents/scoped-custom-element-registry/package.json`,
        `${outputPath}/node_modules/@webcomponents/scoped-custom-element-registry/`
      );
      const scopedCustomElementRegistryLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@webcomponents/scoped-custom-element-registry/*.js`,
        `${outputPath}/node_modules/@webcomponents/scoped-custom-element-registry/`
      );
      const materialButtonPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-button/package.json`,
        `${outputPath}/node_modules/@material/mwc-button/`
      );
      const materialButtonLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-button/*.js`,
        `${outputPath}/node_modules/@material/mwc-button/`
      );
      const materialIconPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-icon/package.json`,
        `${outputPath}/node_modules/@material/mwc-icon/`
      );
      const materialIconLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-icon/*.js`,
        `${outputPath}/node_modules/@material/mwc-icon/`
      );
      const materialRipplePackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-ripple/package.json`,
        `${outputPath}/node_modules/@material/mwc-ripple/`
      );
      const materialRippleLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-ripple/*.js`,
        `${outputPath}/node_modules/@material/mwc-ripple/`
      );
      const materialRippledPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/ripple/package.json`,
        `${outputPath}/node_modules/@material/ripple/`
      );
      const materialRippledLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/ripple/*.js`,
        `${outputPath}/node_modules/@material/ripple/`
      );
      const materialBasePackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-base/package.json`,
        `${outputPath}/node_modules/@material/mwc-base/`
      );
      const materialBaseLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/mwc-base/*.js`,
        `${outputPath}/node_modules/@material/mwc-base/`
      );
      const materialBasedPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/base/package.json`,
        `${outputPath}/node_modules/@material/base/`
      );
      const materialBasedLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/base/*.js`,
        `${outputPath}/node_modules/@material/base/`
      );
      const materialDomPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/dom/package.json`,
        `${outputPath}/node_modules/@material/dom/`
      );
      const materialDomLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/dom/*.js`,
        `${outputPath}/node_modules/@material/dom/`
      );
      const materialFeatureTargetingJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/feature-targeting/package.json`,
        `${outputPath}/node_modules/@material/feature-targeting/`
      );
      const materialFeatureTargetingLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/feature-targeting/*.js`,
        `${outputPath}/node_modules/@material/feature-targeting/`
      );
      const materialAnimationPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/animation/package.json`,
        `${outputPath}/node_modules/@material/animation/`
      );
      const materialAnimationLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/animation/*.js`,
        `${outputPath}/node_modules/@material/animation/`
      );
      const materialRtlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/rtl/package.json`,
        `${outputPath}/node_modules/@material/rtl/`
      );
      const materialRtlLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/rtl/*.js`,
        `${outputPath}/node_modules/@material/rtl/`
      );
      const materialThemePackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/theme/package.json`,
        `${outputPath}/node_modules/@material/theme/`
      );
      const materialThemeLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@material/theme/*.js`,
        `${outputPath}/node_modules/@material/theme/`
      );
      const tslibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/tslib/package.json`,
        `${outputPath}/node_modules/tslib/`
      );
      const tslibLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/tslib/*.js`,
        `${outputPath}/node_modules/tslib/`
      );
      const stencilCorePackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@stencil/core/package.json`,
        `${outputPath}/node_modules/@stencil/core/`
      );
      const stencilCoreCoreLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@stencil/core/internal/stencil-core/*.js`,
        `${outputPath}/node_modules/@stencil/core/internal/stencil-core/`
      );
      const stencilCoreClientLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@stencil/core/internal/client/*.js`,
        `${outputPath}/node_modules/@stencil/core/internal/client/`
      );

      // manually copy all these @babel/runtime files recursively since there are too many of them to do it individually
      const babelRuntimeLibs = await rreaddir(`${process.cwd()}/node_modules/@babel/runtime`);

      await fs.promises.mkdir(`${outputPath}/node_modules/@babel/runtime`, { recursive: true });
      await fs.promises.copyFile(`${process.cwd()}/node_modules/@babel/runtime/package.json`, `${outputPath}/node_modules/@babel/runtime/package.json`);
      await Promise.all(babelRuntimeLibs.filter((asset) => {
        const target = asset.replace(process.cwd(), fileURLToPath(new URL('.', import.meta.url)));
        const isDirectory = path.extname(target) === '';

        if (isDirectory && !fs.existsSync(target)) {
          fs.mkdirSync(target);
        } else if (!isDirectory) {
          return asset;
        }
      }).map((asset) => {
        const target = asset.replace(process.cwd(), fileURLToPath(new URL('.', import.meta.url)));

        return copyFile(asset, target);
      }));

      const regeneratorRuntimeLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/regenerator-runtime/*.js`,
        `${outputPath}/node_modules/regenerator-runtime/`
      );
      const regeneratorRuntimeLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/regenerator-runtime/package.json`,
        `${outputPath}/node_modules/regenerator-runtime/`
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
        ...litHtmlSourceMap,
        ...simpleCss,
        ...simpleCssPackageJson,
        ...lionButtonLibs,
        ...lionButtonLibsPackageJson,
        ...lionCoreLibs,
        ...lionCoreTesterLibs,
        ...lionCoreLibsPackageJson,
        ...lionCoreSrcLibs,
        ...lionCalendarLibs,
        ...lionCalendarLibsPackageJson,
        ...lionCalendarTesterLibs,
        ...lionLocalizeLibs,
        ...lionLocalizeLibsPackageJson,
        ...lionLocalizeTesterLibs,
        ...lionLocalizeSrcLibs,
        ...owcDepupLibPackageJson,
        ...owcScopedLibPackageJson,
        ...messageFormatLibs,
        ...messageFormatLibsPackageJson,
        ...singletonManagerLibsPackageJson,
        ...singletonManagerLibs,
        ...trustedTypesPackageJson,
        ...regeneratorRuntimeLibs,
        ...regeneratorRuntimeLibsPackageJson,
        ...scopedCustomElementRegistryPackageJson,
        ...scopedCustomElementRegistryLibs,
        ...materialButtonPackageJson,
        ...materialButtonLibs,
        ...materialIconPackageJson,
        ...materialIconLibs,
        ...materialRipplePackageJson,
        ...materialRippleLibs,
        ...materialRippledPackageJson,
        ...materialRippledLibs,
        ...materialBasePackageJson,
        ...materialBaseLibs,
        ...materialBasedPackageJson,
        ...materialBasedLibs,
        ...materialDomPackageJson,
        ...materialDomLibs,
        ...materialFeatureTargetingJson,
        ...materialFeatureTargetingLibs,
        ...materialAnimationPackageJson,
        ...materialAnimationLibs,
        ...materialRtlPackageJson,
        ...materialRtlLibs,
        ...materialThemePackageJson,
        ...materialThemeLibs,
        ...tslibPackageJson,
        ...tslibLibs,
        ...stencilCorePackageJson,
        ...stencilCoreCoreLibs,
        ...stencilCoreClientLibs
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
      let dom;
      let expectedImportMap;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            
            dom = new JSDOM(body);
            expectedImportMap = JSON.parse(fs.readFileSync(new URL('./import-map.snapshot.json', import.meta.url), 'utf-8'));
            
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

      it('should return an import map shim <script> in the <head> of the document', function(done) {
        const importMapTag = dom.window.document.querySelectorAll('head > script[type="importmap-shim"]')[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        Object.keys(expectedImportMap).forEach((key) => {
          expect(importMap[key]).to.equal(expectedImportMap[key]);
        });

        // https://github.com/ProjectEvergreen/greenwood/issues/715
        // export maps with "flat" entries
        expect(importMap['@lion/button']).to.equal('/node_modules/@lion/button/index.js');
        expect(importMap['@lion/button/define']).to.equal('/node_modules/@lion/button/define.js');

        // https://github.com/ProjectEvergreen/greenwood/issues/715
        // transient dependency import / exports
        expect(importMap['@bundled-es-modules/message-format/MessageFormat.js']).to.equal('/node_modules/@bundled-es-modules/message-format/MessageFormat.js');

        // https://github.com/ProjectEvergreen/greenwood/issues/748
        expect(importMap['@material/mwc-button']).to.equal('/node_modules/@material/mwc-button/mwc-button.js');
        expect(importMap['@material/mwc-button/mwc-button-base.js']).to.equal('/node_modules/@material/mwc-button/mwc-button-base.js');

        expect(importMap['@material/mwc-icon']).to.equal('/node_modules/@material/mwc-icon/mwc-icon.js');
        expect(importMap['@material/mwc-icon/mwc-icon']).to.equal('/node_modules/@material/mwc-icon/mwc-icon.js');
        expect(importMap['@material/mwc-icon/mwc-icon/@material/mwc-icon/mwc-icon.js']).to.be.undefined;

        expect(importMap['@material/mwc-ripple']).to.equal('/node_modules/@material/mwc-ripple/mwc-ripple.js');
        expect(importMap['@material/mwc-ripple/mwc-ripple']).to.equal('/node_modules/@material/mwc-ripple/mwc-ripple.js');
        expect(importMap['@material/mwc-ripple/mwc-ripple/@material/mwc-ripple/mwc-ripple.js']).to.be.undefined;

        // https://github.com/ProjectEvergreen/greenwood/issues/773
        expect(importMap['@material/base/component']).to.equal('/node_modules/@material/base/component.js');
        expect(importMap['@material/base/foundation']).to.equal('/node_modules/@material/base/foundation.js');
        expect(importMap['@material/base/types']).to.equal('/node_modules/@material/base/types.js');

        done();
      });

      it('should return an import map in the <head> of the document', function(done) {
        const importMapShimTag = dom.window.document.querySelectorAll('head > script[defer]')[0];
        const shimSrc = importMapShimTag.getAttribute('src');

        expect(shimSrc).to.equal('/node_modules/es-module-shims/dist/es-module-shims.js');

        done();
      });

      it('should add a <script> tag for livereload', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script[src]'));
        const livereloadScript = scriptTags.filter((tag) => {
          return tag.getAttribute('src').indexOf('livereload.js') >= 0;
        });

        expect(livereloadScript.length).to.equal(1);

        done();
      });   
    });

    describe('Develop command specific 404 Not Found page HTML behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/404/`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            
            dom = new JSDOM(body);
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

      it('should the correct default <title> tag in the <head>', function(done) {
        const title = dom.window.document.querySelectorAll('head > title')[0];

        expect(title.textContent).to.equal('Page Not Found');

        done();
      });

      it('should the correct default <h1> tag in the <body>', function(done) {
        const heading = dom.window.document.querySelectorAll('body > h1')[0];

        expect(heading.textContent).to.equal('Sorry, unfortunately the page could not be found.');

        done();
      });
    });

    describe('Develop command specific JavaScript behaviors for user authored custom element', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/components/header.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('class HeaderComponent extends HTMLElement');
        done();
      });
    });

    describe('Develop command specific CSS behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/styles/main.css`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should eturn a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('color: blue;');
        done();
      });
    });

    describe('Develop command with image (png) specific behavior', function() {
      const ext = 'png';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {

          request.get(`${hostname}:${port}/assets/logo.${ext}`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain(`image/${ext}`);
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('PNG');
        done();
      });
    });

    describe('Develop command with image (ico) specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/favicon.ico`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('image/x-icon');
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('\u0000');
        done();
      });
    });

    describe('Develop command with image (webp) specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/river-valley.webp`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('image/webp');
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('\u0000');
        done();
      });
    });

    describe('Develop command with image (avif) specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/fox.avif`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('image/avif');
        done();
      });

      it('should return binary data', function(done) {
        expect(response.body).to.contain('\u0000');
        done();
      });
    });

    describe('Develop command with image (svg) specific behavior', function() {
      const ext = 'svg';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/webcomponents.${ext}`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain(`image/${ext}+xml`);
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.indexOf('<svg')).to.equal(0);
        done();
      });
    });

    describe('Develop command with font specific (.woff) behavior', function() {
      const ext = 'woff';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/source-sans-pro.woff?v=1`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain(ext);
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('wOFF');
        done();
      });
    });

    describe('Develop command with JSON specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/assets/data.json`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = JSON.parse(body);

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.name).to.equal('Marvin');
        done();
      });
    });

    describe('Develop command with source map specific behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/lit-html/lit-html.js.map`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('"sources":["src/lit-html.ts"]');
        done();
      });
    });

    describe('Develop command specific node modules resolution behavior for JS with query string', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/lit-html/lit-html.js?type=xyz`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('Copyright 2017 Google LLC');
        done();
      });
    });

    describe('Develop command specific node modules resolution behavior for CSS with query string', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/simpledotcss/simple.css?xyz=123`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should correctly return CSS from the developers local files', function(done) {
        expect(response.body).to.contain('/* Set the global variables for everything. Change these to use your own fonts/colours. */');
        done();
      });
    });

    // if things work correctly, this workspace file should never resolve to the equivalent node_modules file
    // https://github.com/ProjectEvergreen/greenwood/pull/687
    describe('Develop command specific workspace resolution when local file matches a file also in node_modules', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/lit-html.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.equal('console.debug(\'its just a prank bro!\');');
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/715
    describe('Develop command node_modules resolution for a transient dependency\'s own imports', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/@bundled-es-modules/message-format/MessageFormat.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('export default messageFormat;');
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/715
    // @lion/calendar/define -> /node_modules/@lion/calendar/lion-calendar.js
    describe('Develop command node_modules resolution for a flat export map entry from a dependency (not import or default)', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/node_modules/@lion/calendar/lion-calendar.js`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('customElements.define(\'lion-calendar\', LionCalendar);');
        done();
      });
    });

    // need some better 404 handling here (promise reject handling for assets and routes)
    describe('Develop command with default 404 behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/abc.js`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 404 status', function(done) {
        expect(response.statusCode).to.equal(404);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/plain');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('');
        done();
      });

      it('should return the correct status message body', function(done) {
        expect(response.statusMessage).to.contain('Not Found');
        done();
      });
    });

    // proxies to https://jsonplaceholder.typicode.com/posts via greenwood.config.js
    describe('Develop command with dev proxy', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}:${port}/posts?id=7`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = JSON.parse(body);

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.have.lengthOf(1);
        done();
      });
    });

    describe('Develop command with API specific behaviors', function() {
      const name = 'Greenwood';
      let response = {};
      let data = {};

      before(async function() {
        response = await fetch(`${hostname}:${port}/api/greeting?name=${name}`);

        data = await response.json();
      });

      it('should return a 200 status', function(done) {
        expect(response.ok).to.equal(true);
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('application/json; charset=utf-8');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(data.message).to.equal(`Hello ${name}!!!`);
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