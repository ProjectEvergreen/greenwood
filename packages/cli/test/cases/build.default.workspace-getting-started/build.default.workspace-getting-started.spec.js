/*
 * Use Case
 * Run Greenwood build command and reproduce building the Getting Started docs companion repo
 * https://github.com/ProjectEvergreen/greenwood-getting-started
 *
 * User Result
 * Should generate a Greenwood build that generally reproduces the Getting Started guide
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   assets/
 *     greenwood-logo.png
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.md
 *   styles/
 *     theme.css
 *   layouts/
 *     app.html
 *     blog.html
 */
import chai from 'chai';
import fs from 'fs';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles, tagsMatch } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Workspace based on the Getting Started guide and repo';
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

    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('Folder Structure and Home Page', function() {
      let dom;
      let html;

      before(async function() {
        const htmlPath = path.resolve(this.context.publicDir, 'index.html');

        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        html = await fs.promises.readFile(htmlPath, 'utf-8');
      });

      describe('document <html>', function() {
        it('should have an <html> tag with the DOCTYPE attribute', function() {
          expect(html.indexOf('<!DOCTYPE html>')).to.be.equal(0);
        });

        it('should have a <head> tag with the lang attribute on it', function() {
          const htmlTag = dom.window.document.querySelectorAll('html');

          expect(htmlTag.length).to.equal(1);
          expect(htmlTag[0].getAttribute('lang')).to.be.equal('en');
          expect(htmlTag[0].getAttribute('prefix')).to.be.equal('og:http://ogp.me/ns#');
        });

        it('should have matching opening and closing <head> tags', function() {
          expect(tagsMatch('<html>', html)).to.be.equal(true);
        });
      });

      describe('head section tags', function() {
        let metaTags;

        before(function() {
          metaTags = dom.window.document.querySelectorAll('head > meta');
        });

        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;

          expect(title).to.be.equal('My App');
        });

        it('should have five default <meta> tags in the <head>', function() {
          expect(metaTags.length).to.be.equal(5);
        });

        it('should have default mobile-web-app-capable <meta> tag', function() {
          const mwacMeta = metaTags[2];

          expect(mwacMeta.getAttribute('name')).to.be.equal('mobile-web-app-capable');
          expect(mwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-capable <meta> tag', function() {
          const amwacMeta = metaTags[3];

          expect(amwacMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-capable');
          expect(amwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-status-bar-style <meta> tag', function() {
          const amwasbsMeta = metaTags[4];

          expect(amwasbsMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-status-bar-style');
          expect(amwasbsMeta.getAttribute('content')).to.be.equal('black');
        });
      });

      describe('additional custom workspace output', function() {
        it('should create a new assets directory', function() {
          expect(fs.existsSync(path.join(this.context.publicDir, 'assets'))).to.be.true;
        });

        it('should contain files from the asset directory', async function() {
          expect(fs.existsSync(path.join(this.context.publicDir, 'assets', './greenwood-logo.png'))).to.be.true;
        });

        it('should output two JS bundle files', async function() {
          expect(await glob.promise(path.join(this.context.publicDir, './*.js'))).to.have.lengthOf(2);
        });

        it('should have two <script> tags in the <head>', async function() {
          const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));

          expect(scriptTags.length).to.be.equal(2);
        });

        it('should output one CSS file', async function() {
          expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`)).to.have.lengthOf(1);
        });

        it('should output one <style> tag in the <head>', async function() {
          const styleTags = dom.window.document.querySelectorAll('head style');

          expect(styleTags.length).to.be.equal(1);
        });

        it('should output one <link> tag in the <head>', async function() {
          const linkTags = dom.window.document.querySelectorAll('head link[rel="stylesheet"]');

          expect(linkTags.length).to.be.equal(1);
        });

        it('should have content in the <body>', function() {
          const h2 = dom.window.document.querySelector('body h2');
          const p = dom.window.document.querySelector('body p');
          const h3 = dom.window.document.querySelector('body h3');

          expect(h2.textContent).to.be.equal('Home Page');
          expect(p.textContent).to.be.equal('This is the Getting Started home page!');
          expect(h3.textContent).to.be.equal('My Posts');
        });

        it('should have an unordered list of blog posts in the <body>', function() {
          const ul = dom.window.document.querySelectorAll('body ul');
          const li = dom.window.document.querySelectorAll('body ul li');
          const links = dom.window.document.querySelectorAll('body ul a');

          expect(ul.length).to.be.equal(1);
          expect(li.length).to.be.equal(2);
          expect(links.length).to.be.equal(2);

          expect(links[0].href.replace('file://', '').replace(/\/[A-Z]:/, '')).to.be.equal('/blog/second-post/');
          expect(links[0].textContent).to.be.equal('my-second-post');

          expect(links[1].href.replace('file://', '').replace(/\/[A-Z]:/, '')).to.be.equal('/blog/first-post/');
          expect(links[1].textContent).to.be.equal('my-first-post');
        });

        it('should have a <app-header> tag in the <body>', function() {
          const header = dom.window.document.querySelectorAll('body app-header');

          expect(header.length).to.be.equal(1);
        });

        it('should have a <app-footer> tag in the <body>', function() {
          const footer = dom.window.document.querySelectorAll('body app-footer');

          expect(footer.length).to.be.equal(1);
        });
      });
    });

    describe('First Blog Post', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog/first-post/index.html'));
      });

      it('should create a blog directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog'))).to.be.true;
      });

      it('should output an index.html file for first-post page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', './index.html'))).to.be.true;
      });

      it('should have two <script> tags in the <head>', async function() {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should output no <style> tags in the <head>', async function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(0);
      });

      it('should output one <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head link[rel="stylesheet"]');

        expect(linkTags.length).to.be.equal(1);
      });

      it('should have a <app-header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body app-header');

        expect(header.length).to.be.equal(1);
      });

      it('should have an the expected content in the <body>', function() {
        const h1 = dom.window.document.querySelector('body h1');
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelectorAll('body p');

        expect(h1.textContent).to.be.equal('A Blog Post Page');
        expect(h2.textContent).to.be.equal('My First Blog Post');

        expect(p[0].textContent).to.be.equal('Lorem Ipsum');
        expect(p[1].textContent).to.be.equal('back');
      });

      it('should have a <app-footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body app-footer');

        expect(footer.length).to.be.equal(1);
      });
    });

    describe('Second Blog Post', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog/second-post/index.html'));
      });

      it('should create a blog directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog'))).to.be.true;
      });

      it('should output an index.html file for first-post page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'second-post', './index.html'))).to.be.true;
      });

      it('should have two <script> tags in the <head>', async function() {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should output no <style> tags in the <head>', async function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(0);
      });

      it('should output one <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head link[rel="stylesheet"]');

        expect(linkTags.length).to.be.equal(1);
      });

      it('should have a <app-header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body app-header');

        expect(header.length).to.be.equal(1);
      });

      it('should have an the expected content in the <body>', function() {
        const h1 = dom.window.document.querySelector('body h1');
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelectorAll('body p');

        expect(h1.textContent).to.be.equal('A Blog Post Page');
        expect(h2.textContent).to.be.equal('My Second Blog Post');

        expect(p[0].textContent).to.be.equal('Lorem Ipsum');
        expect(p[1].textContent).to.be.equal('back');
      });

      it('should have a <app-footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body app-footer');

        expect(footer.length).to.be.equal(1);
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});