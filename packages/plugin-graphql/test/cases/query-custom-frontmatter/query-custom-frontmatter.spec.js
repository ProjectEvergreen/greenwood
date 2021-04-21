/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using ChildrenQuery, simulating 
 * a link of blog posts derivered from a pages/blog directory with custom frontmatter.  Also uses LitElement.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph in the body 
 * of the home page as a list of blog post links.
 *
 * User Command
 * greenwood build
 *
 * Default Config (+ plugin-graphql)
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
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom GraphQuery for Front Matter from GraphQL';
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

    describe('Home Page <posts-list> w/ custom Graph query', function() {
      
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
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, './*-cache.json'));

        expect(cacheFiles).to.have.lengthOf(1);
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
      
      it('should have a expected Query output in the <body> tag for posts list links', function() {
        const listItems = dom.window.document.querySelectorAll('body ul li');
        const link1 = listItems[0].querySelector('a');
        const link2 = listItems[1].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        
        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to read my First blog post');
        expect(link1.innerHTML).to.contain('First');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to read my Second blog post');
        expect(link2.innerHTML).to.contain('Second');
      });

      it('should have a expected Query output in the <body> tag for posts list authors and dates from custom frontmatter', function() {
        const authors = dom.window.document.querySelectorAll('body ul li span.author');
        const dates = dom.window.document.querySelectorAll('body ul li span.date');

        expect(authors.length).to.be.equal(2);
        expect(dates.length).to.be.equal(2);
        
        expect(authors[0].innerHTML).to.be.contain('Written By: someone@blog.com');
        expect(dates[0].innerHTML).to.be.contain('On: 07.08.2020');

        expect(authors[1].innerHTML).to.be.contain('Written By: someone_else@blog.com');
        expect(dates[1].innerHTML).to.be.contain('On: 07.09.2020');
      });
    });

  });

  after(function() {
    runner.teardown();
  });

});