/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using GraphQuaery.
 *
 * User Result
 * Should generate a Greenwood build that tests basic output from the GraphQuery.
 * 
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     debug-output.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.html
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Graph from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
  let setup;

  before(async function() {
    setup = new TestBed();

    const greenwoodGraphqlCoreLibs = (await glob(`${process.cwd()}/packages/plugin-graphql/src/core/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/@greenwood/plugin-graphql/src/core/',
        name: path.basename(lib)
      };
    });
    const greenwoodGraphqlQueryLibs = (await glob(`${process.cwd()}/packages/plugin-graphql/src/queries/*.gql`)).map((lib) => {
      return {
        dir: 'node_modules/@greenwood/plugin-graphql/src/queries/',
        name: path.basename(lib)
      };
    });
    const litElementLibs = (await glob(`${process.cwd()}/node_modules/lit-element/lib/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/lit-element/lib/',
        name: path.basename(lib)
      };
    });
    const litHtmlLibs = (await glob(`${process.cwd()}/node_modules/lit-html/lib/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/lit-html/lib/',
        name: path.basename(lib)
      };
    });

    this.context = await setup.setupTestBed(__dirname, [
      ...greenwoodGraphqlCoreLibs,
      ...greenwoodGraphqlQueryLibs, 
      {
        // lit-element (+ lit-html)
        dir: 'node_modules/lit-element/',
        name: 'lit-element.js'
      }, {
        dir: 'node_modules/lit-element/',
        name: 'package.json'
      },

      ...litElementLibs, 
      
      {
        dir: 'node_modules/lit-html/',
        name: 'lit-html.js'
      }, {
        dir: 'node_modules/lit-html/',
        name: 'package.json'
      },
      
      ...litHtmlLibs
    ]);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Home Page output w/ GraphQuery', function() {
      
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

        expect(listItems.length).to.be.equal(3);        
        
        expect(listItems[0].innerHTML).to.be.contain('First Post');
        expect(listItems[1].innerHTML).to.be.contain('Second Post');
        expect(listItems[2].innerHTML).to.be.contain('Index');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});