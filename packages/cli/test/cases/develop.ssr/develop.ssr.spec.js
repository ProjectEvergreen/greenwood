/*
 * Use Case
 * Run Greenwood for development with a server side route.
 *
 * User Result
 * Should serve a bare bones Greenwood build for developing a server rendered application.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {}
 *
 * User Workspace
 *  src/
 *   components/
 *     footer.js
 *   pages/
 *     blog
 *       first-post.js
 *       index.js
 *     artists.js
 *     post.js
 *   layouts/
 *     app.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Project (SSR)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:1984';
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
      const litSsrPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-dom-shim/package.json`,
        `${outputPath}/node_modules/@lit-labs/ssr-dom-shim/`
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

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...lit,
        ...litPackageJson,
        ...litSsrPackageJson,
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

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Develop command with HTML route response using getLayout, getBody, getFrontmatter', function() {
      let response = {};
      let dom;
      let artistsPageGraphData;
      let body;

      before(async function() {
        const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, '.greenwood/graph.json'), 'utf-8'));

        response = await fetch(`${hostname}/artists/`);
        body = await response.text();
        dom = new JSDOM(body);
        artistsPageGraphData = graph.filter(page => page.route === '/artists/')[0];
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have one style tag', function() {
        const styles = dom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      it('should have the expected number of table rows of content', function() {
        const rows = dom.window.document.querySelectorAll('body > table tr');

        expect(rows.length).to.equal(11);
      });

      it('should have the <app-footer> tag in the body', function() {
        const footer = dom.window.document.querySelectorAll('body > app-footer');

        expect(footer.length).to.equal(1);
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
          .filter((tag) => tag.getAttribute('src').indexOf(`${componentName}.js`) >= 0);

        expect(artistsPageGraphData.imports[0]).to.equal(`/components/${componentName}.js`);
        expect(counterScript.length).to.equal(1);
      });
    });

    describe('Develop command with HTML route response using default export and request time data', function() {
      const postId = 1;
      let response = {};
      let dom = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/post/?id=${postId}`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected postId as an <h1> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h1');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal(`Fetched Post ID: ${postId}`);
      });

      it('should have the expected title as an <h2> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h2');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.not.be.undefined;
      });

      it('should have the expected body as a <p> tag in the body', function() {
        const paragraph = dom.window.document.querySelectorAll('body > p');

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.not.be.undefined;
      });
    });

    describe('Develop command with HTML route response using default export and nested SSR Blog Index page', function() {
      let response = {};
      let dom = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/blog/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected postId as an <h1> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h1');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Nested SSR page should work!');
      });
    });

    describe('Develop command with HTML route response using default export and nested SSR Blog First Post page', function() {
      let response = {};
      let dom = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/blog/first-post/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected postId as an <h1> tag in the body', function() {
        const heading = dom.window.document.querySelectorAll('body > h1');

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Nested SSR First Post page should work!');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});