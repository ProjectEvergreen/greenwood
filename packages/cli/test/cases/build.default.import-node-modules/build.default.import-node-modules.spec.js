/*
 * Use Case
 * Run Greenwood with and loading different references to node_module types to ensure proper support.
 * Sets prerender: true to validate the functionality.
 * 
 * User Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Importing packages from node modules';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let dom;

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
      // lit-html has a dependency on this
      // https://github.com/lit/lit/blob/main/packages/lit-html/package.json#L82
      const trustedTypes = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
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
      const reduxLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/es/redux.mjs`, 
        `${outputPath}/node_modules/redux/es`
      );
      const reduxPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/package.json`, 
        `${outputPath}/node_modules/redux/`
      );
      const looseLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/loose-envify/index.js`, 
        `${outputPath}/node_modules/loose-envify`
      );
      const looseLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/loose-envify/package.json`, 
        `${outputPath}/node_modules/loose-envify/`
      );
      const tokensLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/js-tokens/index.js`, 
        `${outputPath}/node_modules/js-tokens`
      );
      const tokensLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/js-tokens/package.json`, 
        `${outputPath}/node_modules/js-tokens/`
      );
      const symbolLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/symbol-observable/es/*.js`, 
        `${outputPath}/node_modules/symbol-observable/es`
      );
      const symobolLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/symbol-observable/package.json`, 
        `${outputPath}/node_modules/symbol-observable/`
      );
      const lodashEsLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lodash-es/*.js`, 
        `${outputPath}/node_modules/lodash-es/`
      );
      const lodashEsLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lodash-es/package.json`, 
        `${outputPath}/node_modules/lodash-es/`
      );
      const pwaHelpersLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/*.js`, 
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const pwaHelpersPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/package.json`, 
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const simpleCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/simple.css`, 
        `${outputPath}/node_modules/simpledotcss/`
      );
      const simpleCssPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/package.json`, 
        `${outputPath}/node_modules/simpledotcss/`
      );
      const prismCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/themes/prism-tomorrow.css`,
        `${outputPath}/node_modules/prismjs/themes/`
      );
      const prismPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/package.json`, 
        `${outputPath}/node_modules/prismjs/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...reduxLibs,
        ...reduxPackageJson,
        ...looseLibs,
        ...looseLibsPackageJson,
        ...tokensLibs,
        ...tokensLibsPackageJson,
        ...symbolLibs,
        ...symobolLibsPackageJson,
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
        ...trustedTypes,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson,
        ...lodashEsLibs,
        ...lodashEsLibsPackageJson,
        ...pwaHelpersPackageJson,    
        ...pwaHelpersLibs,
        ...prismCss,
        ...prismPackageJson,
        ...simpleCss,
        ...simpleCssPackageJson
      ]);
      await runner.runCommand(cliPath, 'build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('<script src="..."> tag in the <head> tag', function() {
      it('should have one <script src="..."> tag for main.js loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/main.*.js/).test(script.src);
        });
        
        expect(mainScriptTags.length).to.be.equal(1);
      });

      it('should have the total expected number of .js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(3);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });
    });

    describe('<script> tag with inline code in the <head> tag', function() {
      it('should have one <script> tag with inline code loaded in the <head> tag', function() {
        const scriptTagsInline = dom.window.document.querySelectorAll('head > script:not([src])');
        
        expect(scriptTagsInline.length).to.be.equal(1);
      });

      it('should have the expected lit related files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'lit-element.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected inline node_modules content in the first inline script', async function() {
        const inlineScriptTag = dom.window.document.querySelectorAll('head > script:not([src])')[0];
        
        expect(inlineScriptTag.textContent.replace('\n', '')).to
          .equal('import"/lit-element.ae169679.js";import"/lit-html.7f7a9139.js";//# sourceMappingURL=2012376258-scratch.0a6fc17c.js.map');
      });
    });

    describe('<script src="..."> with reference to node_modules/ path in the <head> tag', function() {
      it('should have one <script src="..."> tag for lit-html loaded in the <head> tag', function() {
        const scriptTagsInline = dom.window.document.querySelectorAll('head > script[src]');
        const litScriptTags = Array.prototype.slice.call(scriptTagsInline).filter(script => {
          return (/lit-.*.js/).test(script.src);
        });

        expect(litScriptTags.length).to.be.equal(1);
      });

      it('should have the expected lit-html.js files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'lit-html.*.js'))).to.have.lengthOf(1);
      });
    });

    describe('<link rel="stylesheet" href="..."> with reference to node_modules/ path in the <head> tag', function() {
      it('should have one <link href="..."> tag in the <head> tag', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
        const prismLinkTag = Array.prototype.slice.call(linkTags).filter(link => {
          return (/prism-tomorrow.*.css/).test(link.href);
        });

        expect(prismLinkTag.length).to.be.equal(1);
      });

      it('should have the expected prism.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'prism-tomorrow.*.css'))).to.have.lengthOf(1);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});