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
 * Default Config (+ plugin-graphql)
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
const greenwoodConfig = require('./greenwood.config');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'ConfigQuery from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
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
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, [ 
        ...getSetupFiles(outputPath),
        ...greenwoodGraphqlCoreLibs,
        ...greenwoodGraphqlQueryLibs
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('displaying config title in the footer using ConfigQuery', function() {
      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have a <footer> in the <body> with greenwoodConfig#title as the text value', function() {
        const footer = dom.window.document.querySelector('body footer');

        expect(footer.innerHTML).to.be.equal(greenwoodConfig.title);
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

    });
  });

  after(function() {
    runner.teardown();
  });

});