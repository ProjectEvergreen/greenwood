/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using MenuQuery, simluting 
 * a site navigation based on top level page routes.  Also uses LitElement.
 * 
 * Needs prerender to be true to get SSR and client side GQL fetching.
 * 
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph from the header.
 *
 * User Command
 * greenwood build
 *
 * Default Config (+ plugin-graphql and prerender)
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     about.md
 *     contact.md
 *     index.md
 *   templates/
 *     page.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { copyDirectory, getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'MenuQuery from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
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
      const greenwoodGraphqlCoreLibs = await getDependencyFiles(
        `${process.cwd()}/packages/plugin-graphql/src/core/*.js`, 
        `${outputPath}/node_modules/@greenwood/plugin-graphql/src/core/`
      );
      const greenwoodGraphqlQueryLibs = await getDependencyFiles(
        `${process.cwd()}/packages/plugin-graphql/src/queries/*.gql`, 
        `${outputPath}/node_modules/@greenwood/plugin-graphql/src/queries/`
      );
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

      // stub puppeteer dependency to avoid package manager installation when running specs that need prerendering
      await copyDirectory(`${process.cwd()}/node_modules/puppeteer`, `${outputPath}node_modules/puppeteer`);

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodGraphqlCoreLibs,
        ...greenwoodGraphqlQueryLibs, 
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

    describe('Home Page navigation w/ MenuQuery', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', function() {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it('should output a single (partial) *-cache.json file, one per each query made', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*-cache.json'))).to.have.lengthOf(1);
      });

      it('should output a (partial) *-cache.json files, one per each query made, that are all defined', async function() {
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, './*-cache.json'));

        cacheFiles.forEach(file => {
          const cache = JSON.parse(fs.readFileSync(file, 'utf-8'));

          expect(cache).to.not.be.undefined;
        });
      });

      it('should have a <header> in the <body>', function() {
        const headers = dom.window.document.querySelectorAll('body header');

        expect(headers.length).to.be.equal(1);
      });
      
      it('should have a expected navigation output in the <header> based on pages with menu: navigation frontmatter', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link1 = listItems[0].querySelector('a');
        const link2 = listItems[1].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        
        expect(link1.href.replace('file://', '').replace(/\/[A-Z]:/, '')).to.be.equal('/about/');
        expect(link1.title).to.be.equal('Click to visit the About page');
        expect(link1.innerHTML).to.contain('About');

        expect(link2.href.replace('file://', '').replace(/\/[A-Z]:/, '')).to.be.equal('/contact/');
        expect(link2.title).to.be.equal('Click to visit the Contact page');
        expect(link2.innerHTML).to.contain('Contact');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});