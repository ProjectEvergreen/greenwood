/*
 * Use Case
 * A theme pack _author_ creating a theme pack and using Greenwood for development and testing
 * following the guide published on the Greenwood website. (https://www.greenwoodjs.io/guides/theme-packs/)
 * 
 * User Result
 * Should correctly validate the develop and build / serve commands work correctly using tge expected templates 
 * being resolved correctly per the known work around needs as documented in the FAQ and tracked in a discussion.
 * https://github.com/ProjectEvergreen/greenwood/discussions/682
 * 
 * User Command
 * greenwood develop
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Plugin Author Workspace
 * src/
 *   components/
 *     header.js
 *   layouts/
 *     blog-post.html
 *   pages/
 *     index.md
 *   styles/
 *     theme.css
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Developement environment for a Theme Pack';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const themePacktemplates = await getDependencyFiles(
        `${path.dirname(new URL('', import.meta.url).pathname)}/src/layouts/*.html`,
        `${outputPath}/node_modules/my-theme-pack/dist/layouts`
      );
      const themePackStyles = await getDependencyFiles(
        `${path.dirname(new URL('', import.meta.url).pathname)}/src/styles/*.css`,
        `${outputPath}/node_modules/my-theme-pack/dist/styles`
      );
      const themePackComponents = await getDependencyFiles(
        `${path.dirname(new URL('', import.meta.url).pathname)}/src/components/*.js`,
        `${outputPath}/node_modules/my-theme-pack/dist/components`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...themePacktemplates,
        ...themePackStyles,
        ...themePackComponents
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom Default App and Page Templates', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have expected text from layout/blog-post.html', function() {
        const pageTemplateHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageTemplateHeading.textContent).to.be.equal('This is the blog post template called from the layouts directory.');
      });

      it('should have expected text from (test) user workspace pages/index.md', function() {
        const heading = dom.window.document.querySelectorAll('body h2')[0];
        const paragraph = dom.window.document.querySelectorAll('body p')[0];

        expect(heading.textContent).to.be.equal('Title of blog post');
        expect(paragraph.textContent).to.be.equal('Lorum Ipsum, this is a test.');
      });
    });

    describe('Custom Theme Pack theme.css in app template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single CSS file for custom theme pack styles/theme.css', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '**/theme.*.css'))).to.have.lengthOf(1);
      });

      it('should have expected link tag in the head', function() {
        const linkTag = Array.from(dom.window.document.querySelectorAll('head link'))
          .filter((linkTag) => {
            return linkTag.getAttribute('rel') === 'stylesheet'
              && linkTag.getAttribute('href').indexOf('/theme.') === 0;
          });

        expect(linkTag.length).to.equal(1);
      });
    });

    describe('Custom Theme Pack heading.js in custom title page template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single JS file for custom theme pack components/heading.js', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '**/header.*.js'))).to.have.lengthOf(1);
      });

      it('should have expected link tag in the head', function() {
        const scriptTag = Array.from(dom.window.document.querySelectorAll('head script'))
          .filter((linkTag) => {
            return linkTag.getAttribute('src').indexOf('/header.') === 0;
          });

        expect(scriptTag.length).to.equal(1);
      });

      it('should have expected heading component content', function() {
        const header = dom.window.document.querySelector('body x-header header');

        expect(header.textContent).to.equal('Welcome to my blog!');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});

