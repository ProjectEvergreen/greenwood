/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data from the project configuration.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the config in the footer.
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * greenwood.config.js
 * src/
 *   components/
 *     footer.js
 *   pages/
 *     index.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const greenwoodConfig = require('./greenwood.config');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Config from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
  let setup;

  before(async function() {
    setup = new TestBed(true);

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

    this.context = await setup.setupTestBed(__dirname, [
      ...greenwoodGraphqlCoreLibs,
      ...greenwoodGraphqlQueryLibs
    ]);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('displaying config title in the footer using ConfigQuery', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output an index.html file', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have a <footer> in the <body> with greenwoodConfig#title as the text value', function() {
        const footer = dom.window.document.querySelector('body footer');

        expect(footer.innerHTML).to.be.equal(greenwoodConfig.title);
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
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

    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});