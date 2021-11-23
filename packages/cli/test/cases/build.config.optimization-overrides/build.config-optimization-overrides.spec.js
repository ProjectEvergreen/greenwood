/*
 * Use Case
 * Run Greenwood build command with various override settings for optimization settings.
 *
 * User Result
 * Should generate a Greenwood build that respects optimization setting overrides for all <script> and <link> tags.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * Default
 *
 * Custom Workspace
 * src/
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Optimization Overrides';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    describe('Cumulative output based on all override settings', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should emit no Javascript files to the output directory', async function() {
        const jsFiles = await glob.promise(path.join(this.context.publicDir, '**/*.js'));
        
        expect(jsFiles).to.have.lengthOf(0);
      });

      it('should emit no CSS files to the output directory', async function() {
        const cssFiles = await glob.promise(path.join(this.context.publicDir, '**/*.css'));
        
        expect(cssFiles).to.have.lengthOf(0);
      });

      it('should have one <script> tag in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(1);
      });

      // one of these tags comes from puppeteer
      it('should have two <style> tags in the <head>', function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(2);
      });

      it('should have no <link> tags in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(0);
      });
    });

    describe('JavaScript <script> tag and static optimization override for <app-header>', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no <link> tags in the <head>', function() {
        const headerLinkTags = Array.from(dom.window.document.querySelectorAll('head link'))
          .filter(link => link.getAttribute('href').indexOf('header') >= 0);

        expect(headerLinkTags.length).to.be.equal(0);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const headerScriptTags = Array.from(dom.window.document.querySelectorAll('head script'))
          .filter(script => script.getAttribute('src') && script.getAttribute('src').indexOf('header') >= 0);

        expect(headerScriptTags.length).to.be.equal(0);
      });

      it('should contain the expected content from <app-header> in the <body>', function() {
        const headerScriptTags = dom.window.document.querySelectorAll('body header');

        expect(headerScriptTags.length).to.be.equal(1);
        expect(headerScriptTags[0].textContent).to.be.equal('This is the header component.');
      });
    });

    describe('JavaScript <script> tag and inline optimization override for <app-footer>', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no <link> tags in the <head>', function() {
        const footerLinkTags = Array.from(dom.window.document.querySelectorAll('head link'))
          .filter(link => link.getAttribute('href').indexOf('footer') >= 0);

        expect(footerLinkTags.length).to.be.equal(0);
      });
      
      it('should have an inline <script> tag in the <head>', function() {
        const footerScriptTags = Array.from(dom.window.document.querySelectorAll('head script'))
          .filter((script) => {
            // eslint-disable-next-line max-len
            return script.textContent.indexOf('const e=document.createElement("template");e.innerHTML="<footer>This is the footer component.</footer>";class t extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.shadowRoot.appendChild(e.content.cloneNode(!0))}}customElements.define("app-footer",t);') >= 0 
              && !script.getAttribute('src');
          });

        expect(footerScriptTags.length).to.be.equal(1);
      });

      it('should contain the expected content from <app-footer> in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });
    });

    describe('CSS <link> tag and inline optimization override for theme.css', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no <link> tags in the <head>', function() {
        const themeLinkTags = Array.from(dom.window.document.querySelectorAll('head link'))
          .filter(link => link.getAttribute('href').indexOf('theme') >= 0);

        expect(themeLinkTags.length).to.be.equal(0);
      });
      
      it('should have an inline <style> tag in the <head>', function() {
        const themeStyleTags = Array.from(dom.window.document.querySelectorAll('head style'))
          .filter(style => style.textContent.indexOf('*{color:blue}') >= 0);

        expect(themeStyleTags.length).to.be.equal(1);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});