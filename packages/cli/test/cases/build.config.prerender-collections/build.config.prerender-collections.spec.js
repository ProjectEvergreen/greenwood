/*
 * Use Case
 * Run Greenwood build command with prerender config set to true and using various content as data APIs.
 *
 * User Result
 * Should generate a Greenwood build with the expected generated output using custom elements.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeFrontmatter: true,
 *   prerender: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *    blog-posts-lists.js
 *    header.js
 *    toc.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.html
 *     index.html
 *     toc.html
 */

import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles, getDependencyFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Prerender Configuration turned on using collections';
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
      const greenwoodDataLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/data/client.js`,
        `${outputPath}/node_modules/@greenwood/cli/src/data`
      );

      /*
       * need a workaround here or else we get a module loader error
       * ```
       * import { getContentByCollection } from "@greenwood/cli/src/data/client.js";
       * ^^^^^^
       * SyntaxError: Named export 'getContentByCollection' not found. The requested module '@greenwood/cli/src/data/client.js'
       * is a CommonJS module, which may not support all module.exports as named exports.
       * ```
       *
       * but it works fine IRL - https://github.com/ProjectEvergreen/www.greenwoodjs.dev/pull/1
       */
      const packageJson = await getDependencyFiles(
        `${outputPath}/package.json`,
        `${outputPath}/node_modules/@greenwood/cli/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodDataLibs,
        ...packageJson
      ]);
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Default output for index.html with header nav collection content', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      describe('navigation links from getContentByCollection', function() {
        let navLinks;

        before(function() {
          navLinks = dom.window.document.querySelectorAll('header nav ul li a');
        });

        it('should have the expected number of nav links from all pages in the collection', function() {
          expect(navLinks.length).to.equal(3);
        });

        it('should have the expected link content from all pages in the collection', function() {
          expect(navLinks[0].getAttribute('href')).to.equal('/');
          expect(navLinks[0].getAttribute('title')).to.equal('Home');
          expect(navLinks[0].textContent).to.equal('Home');

          expect(navLinks[1].getAttribute('href')).to.equal('/blog/');
          expect(navLinks[1].getAttribute('title')).to.equal('Blog');
          expect(navLinks[1].textContent).to.equal('Blog');

          expect(navLinks[2].getAttribute('href')).to.equal('/toc/');
          expect(navLinks[2].getAttribute('title')).to.equal('Table of Contents');
          expect(navLinks[2].textContent).to.equal('Table of Contents');
        });

        it('should have the expected inline active frontmatter collection data', function() {
          const collection = JSON.parse(dom.window.document.querySelector('body span').textContent)
            .sort((a, b) => a.data.order > b.data.order ? 1 : -1);

          expect(collection[0].route).to.equal('/');
          expect(collection[0].title).to.equal('Home');
          expect(collection[0].label).to.equal(collection[0].title);
          expect(collection[0].id).to.equal('index');

          expect(collection[1].route).to.equal('/blog/');
          expect(collection[1].title).to.equal('Blog');
          expect(collection[1].label).to.equal(collection[1].title);
          expect(collection[1].id).to.equal('blog-index');

          expect(collection[2].route).to.equal('/toc/');
          expect(collection[2].title).to.equal('Table of Contents');
          expect(collection[2].label).to.equal(collection[2].title);
          expect(collection[2].id).to.equal('toc');
        });
      });
    });

    describe('Default output for blog/index.html with routes based collection content', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './blog/index.html'));
      });

      describe('navigation links from getContentByCollection', function() {
        let postLinks;

        before(function() {
          postLinks = dom.window.document.querySelectorAll('ol li a');
        });

        it('should have the expected number of post links from all blog pages in the collection (minus the index route)', function() {
          expect(postLinks.length).to.equal(2);
        });

        it('should have the expected link content from all pages in the collection', function() {
          expect(postLinks[0].getAttribute('href')).to.equal('/blog/first-post/');
          expect(postLinks[0].getAttribute('title')).to.equal('First Post');
          expect(postLinks[0].textContent).to.equal('First Post');

          expect(postLinks[1].getAttribute('href')).to.equal('/blog/second-post/');
          expect(postLinks[1].getAttribute('title')).to.equal('Second Post');
          expect(postLinks[1].textContent).to.equal('Second Post');
        });
      });
    });

    describe('Default output for toc.html with all content in a list', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './toc/index.html'));
      });

      describe('navigation links from getContentByCollection', function() {
        let pageLinks;

        before(function() {
          pageLinks = dom.window.document.querySelectorAll('ol li a');
        });

        // includes 404 page
        it('should have the expected number of post links from all blog pages in the collection (minus the index route)', function() {
          expect(pageLinks.length).to.equal(6);
        });
      });
    });
  });

  after(async function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});