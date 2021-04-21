/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using MenuQuery, simluting 
 * a site navigation based on top level page routes.  Also uses LitElement.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph from the header.
 *
 * User Command
 * greenwood build
 *
 * Default Config (+ plugin-graphql)
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
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'MenuQuery from GraphQL';
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
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Home Page navigation w/ MenuQuery', function() {
      
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

      it('should have a <header> in the <body>', function() {
        const headers = dom.window.document.querySelectorAll('body header');

        expect(headers.length).to.be.equal(1);
      });
      
      it('should have a expected navigation output in the <header> based on pages with menu: navigation frontmatter', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link1 = listItems[0].querySelector('a');
        const link2 = listItems[1].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        
        expect(link1.href.replace('file://', '')).to.be.equal('/about/');
        expect(link1.title).to.be.equal('Click to visit the About page');
        expect(link1.innerHTML).to.contain('About');

        expect(link2.href.replace('file://', '')).to.be.equal('/contact/');
        expect(link2.title).to.be.equal('Click to visit the Contact page');
        expect(link2.innerHTML).to.contain('Contact');
      });
    });

  });

  after(function() {
    runner.teardown();
  });

});