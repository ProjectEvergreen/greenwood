/*
 * Use Case
 * Run Greenwood build command with a static site and only prerendering the content (no JS!).  Modeled after the 
 * Greenwood Getting Started repo.
 * 
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from a LitElement.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginIncludeHTML } from '@greenwod/plugin-include-html';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginRendererLit({
 *       prerender: true
 *     })
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     greenwood-logo.png
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.md
 *   styles/
 *     theme.css
 *   templates/
 *     app.html
 *     blog.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getDependencyFiles, getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With Custom Lit Renderer for SSG prerendering: ', function() {
  const LABEL = 'For SSG prerendering of Getting Started example';
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
      const trustedTypes = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
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
        ...trustedTypes,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson,
        ...litHtmlSourceMap
      ]);
      await runner.runCommand(cliPath, 'build');
    });
    
    // TODO index
    runSmokeTest(['public'], LABEL);

    // TODO remove script tags
    describe('LitElement <app-header> statically rendered into index.html', function() {
      let body;

      before(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));

        body = dom.window.document.querySelector('body');
      });

      it('should have expected footer <h4> tag content in the <body>', function() {
        const html = body.innerHTML.trim();
        
        expect(html).to.contain('<header>');
        expect(html).to.contain('This is the header component.');
      });
    });

    describe('LitElement <app-footer> statically rendered into index.html', function() {
      let body;

      before(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));

        body = dom.window.document.querySelector('body');
      });

      it('should have expected footer <h4> tag content in the <body>', function() {
        const html = body.innerHTML.trim();
        
        expect(html).to.contain('<footer>');
        expect(html).to.contain('My Blog');
        expect(html).to.contain('2022');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});