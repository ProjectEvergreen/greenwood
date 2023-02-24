/*
 * Use Case
 * Run Greenwood with an SSR route.
 *
 * User Result
 * Should generate a Greenwood build for hosting a server rendered application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {}
 *
 * User Workspace
 *  src/
 *   components/
 *     counter.js
 *     footer.js
 *     greeting.js
 *   pages/
 *     artists.js
 *     users.js
 *   templates/
 *     app.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Lit Renderer for SSR';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
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

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    let response = {};
    let artists = [];
    let dom;
    let usersPageDom;
    let usersPageHtml;
    let aboutPageGraphData;

    before(async function() {
      const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, 'public/graph.json'), 'utf-8'));
      artists = JSON.parse(await fs.promises.readFile(new URL('./artists.json', import.meta.url), 'utf-8'));

      aboutPageGraphData = graph.filter(page => page.route === '/artists/')[0];

      return new Promise((resolve, reject) => {
        request.get(`${hostname}/artists/`, (err, res, body) => {
          if (err) {
            reject();
          }

          response = res;
          response.body = body;
          dom = new JSDOM(body);

          request.get(`${hostname}/users/`, (err, res, body) => {
            if (err) {
              reject();
            }
  
            usersPageHtml = body;
            usersPageDom = new JSDOM(body);
  
            resolve();
          });
        });
      });
    });

    describe('Serve command with HTML route response using getBody, getTemplate and getFrontmatter', function() {

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(response.body).to.not.be.undefined;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have one <style> tag in the <head>', function() {
        const styles = dom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      it('should have no <script> tags in the <head>', function() {
        const scripts = dom.window.document.querySelectorAll('head > script');

        expect(scripts.length).to.equal(0);
      });

      it('should have the expected number of <tr> tags of content', function() {
        const rows = dom.window.document.querySelectorAll('body > table tr');

        // one heading and 11 for content
        expect(rows.length).to.equal(12);
      });

      it('should have the expected number of <simple-greeting> components with expected text content', function() {
        const greetings = dom.window.document.querySelectorAll('body > table tr simple-greeting');

        expect(greetings.length).to.equal(11);

        greetings.forEach((greeting, index) => {
          // it should not be the default of Somebody, since real data should be in there
          expect(greeting.innerHTML).to.contain(`Hello, <!--lit-part-->${artists[index].name}`);
        });
      });

      it('should have the expected <title> content in the <head>', function() {
        const title = dom.window.document.querySelectorAll('head > title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('My App - /artists/');
      });

      it('should have custom metadata in the <head>', function() {
        const metaDescription = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter((tag) => tag.getAttribute('name') === 'description');

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute('content')).to.equal('/artists/ (this was generated server side!!!)');
      });

      it('should be a part of graph.json', function() {
        expect(aboutPageGraphData).to.not.be.undefined;
      });

      it('should have the expected menu and index values in the graph', function() {
        expect(aboutPageGraphData.data.menu).to.equal('navigation');
        expect(aboutPageGraphData.data.index).to.equal(7);
      });

      it('should have expected custom data values in its graph data', function() {
        expect(aboutPageGraphData.data.author).to.equal('Project Evergreen');
        expect(aboutPageGraphData.data.date).to.equal('01-01-2021');
      });
    });

    describe('Serve command with HTML route response using LitElement as default export', function() {
      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(usersPageDom).to.not.be.undefined;
        done();
      });

      it('should have the expected <h1> text in the <body>', function() {
        expect(usersPageHtml).to.contain('Users Page');
      });

      it('should have the expected users length text in the <body>', function() {
        expect(usersPageHtml).to.contain(`<div id="users"><!--lit-part-->${artists.length}<!--/lit-part--></div>`);
      });

      it('should have the expected <app-footer> content in the <body>', function() {
        expect(usersPageHtml).to.contain('<footer class="footer">');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});