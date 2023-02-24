/*
 * Use Case
 * Run Greenwood with an SSR route that exports static HTML.
 *
 * User Result
 * Should generate a bare bones Greenwood build with a statically rendered from server routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   components/
 *     counter.js
 *     footer.js
 *   pages/
 *     artists.js
 *   templates/
 *     app.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) that is statically exported';
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
        ...litReactiveElementPackageJson
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Build command that tests for static HTML export from SSR route', function() {
      let dom;
      let artistsPageGraphData;
  
      before(async function() {
        const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, 'public/graph.json'), 'utf-8'));
        const artistsHtml = await fs.promises.readFile(path.join(outputPath, 'public/artists/index.html'), 'utf-8');
        
        artistsPageGraphData = graph.filter(page => page.route === '/artists/')[0];
        dom = new JSDOM(artistsHtml);
      });

      it('should have one style tags', function() {
        const styles = dom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      // TODO clean up lit-polyfill as part of https://github.com/ProjectEvergreen/greenwood/issues/728
      it('should have four script tags', function() {
        const scripts = dom.window.document.querySelectorAll('head > script');

        expect(scripts.length).to.equal(4);
      });

      it('should have expected SSR content from the non module script tag', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(tag => !tag.getAttribute('type') && !tag.getAttribute('src'));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].textContent).to.contain('console.log');
      });

      it('should have a bundled script for the footer component', function() {
        const footerScript = Array.from(dom.window.document.querySelectorAll('head > script[type]'))
          .filter(script => (/footer.*[a-z0-9].js/).test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal('module');
      });

      it('should have the expected number of table rows of content', function() {
        const rows = dom.window.document.querySelectorAll('body > table tr');

        expect(rows.length).to.equal(11);
      });

      it('should have the expected <title> content in the <head>', function() {
        const title = dom.window.document.querySelectorAll('head > title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('/artists/');
      });

      it('should have custom metadata in the <head>', function() {
        const metaDescription = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter((tag) => tag.getAttribute('name') === 'description');

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute('content')).to.equal('/artists/ (this was generated server side!!!)');
      });

      it('should be a part of graph.json', function() {
        expect(artistsPageGraphData).to.not.be.undefined;
      });

      it('should have the expected menu and index values in the graph', function() {
        expect(artistsPageGraphData.data.menu).to.equal('navigation');
        expect(artistsPageGraphData.data.index).to.equal(7);
      });

      it('should have expected custom data values in its graph data', function() {
        expect(artistsPageGraphData.data.author).to.equal('Project Evergreen');
        expect(artistsPageGraphData.data.date).to.equal('01-01-2021');
      });

      it('should append the expected <script> tag for a frontmatter import <x-counter> component', function() {
        const componentName = 'counter';
        const counterScript = Array.from(dom.window.document.querySelectorAll('head > script[src]'))
          .filter((tag) => tag.getAttribute('src').indexOf(`/${componentName}.`) === 0);

        expect(artistsPageGraphData.imports[0].src).to.equal(`/components/${componentName}.js`);
        expect(counterScript.length).to.equal(1);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});