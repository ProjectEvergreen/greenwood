/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using ChildrenQuaery.
 *
 * User Result
 * Should generate a Greenwood build that tests basic output from the ChildrenQuery.
 * 
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     posts-list.js
 *   pages/
 *     blog/
 *       first-post/
 *         index.md
 *       second-post/
 *         index.md
 *     index.html
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Children from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
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
      const litElementLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lib/*.js`, 
        `${outputPath}/node_modules/lit-element/lib/`
      );
      const litElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lit-element.js`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/package.json`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litHtml = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lit-html.js`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lib/*.js`, 
        `${outputPath}/node_modules/lit-html/lib/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodGraphqlCoreLibs,
        ...greenwoodGraphqlQueryLibs, 
        ...litElement,
        ...litElementPackageJson,
        ...litElementLibs,
        ...litHtml,
        ...litHtmlPackageJson,
        ...litHtmlLibs
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Home Page output w/ ChildrenQuery', function() {
      
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
          const cache = require(file);

          expect(cache).to.not.be.undefined;
        });
      });

      it('should have a <ul> in the <body>', function() {
        const lists = dom.window.document.querySelectorAll('body ul');

        expect(lists.length).to.be.equal(1);
      });
      
      it('should have a expected navigation output in the <header> based on pages with menu: navigation frontmatter', function() {
        const listItems = dom.window.document.querySelectorAll('body ul li');

        expect(listItems.length).to.be.equal(2);        
        
        expect(listItems[0].innerHTML).to.be.contain('First Post');
        expect(listItems[1].innerHTML).to.be.contain('Second Post');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});