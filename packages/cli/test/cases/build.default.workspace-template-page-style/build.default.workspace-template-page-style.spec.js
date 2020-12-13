/*
 * Use Case
 * Run Greenwood build command with no config and custom styled page template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom styled page template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   styles/
 *     theme.css
 *   templates/
 *     page.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const path = require('path');
const { JSDOM } = require('jsdom');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Style and Theme Page Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL)
    runSmokeTest(['public', 'index'], LABEL);

    describe('custom <link> tag in the <head> of a page template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should generate a single matching CSS file with hashed filename', async function() {
        expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`)).to.have.lengthOf(1);
      });

      it('should have the expected <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head > link');
        const linkTag = linkTags[0];

        expect(linkTags.length).to.equal(1);
        expect(linkTag.rel).to.equal('stylesheet');
        expect((/styles\/theme.[a-z0-9]{8}.css/).test(linkTag.href)).to.be.true;
      });
    });

    describe('custom <style> tag in the <head> of a page template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom styled page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the expected <style> tag in the <head>', async function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');

        expect(styleTags.length).to.equal(2); // puppeteer creates one
      });

      it('should have the color style for the .owen-test element in the page template that we added as part of our custom style', function() {
        const customElement = dom.window.document.querySelector('.owen-test');
        const computedStyle = dom.window.getComputedStyle(customElement);

        expect(computedStyle.color).to.equal('blue');
      });

      it('should have the color styles for the h3 element that we defined as part of our custom style', function() {
        const customHeader = dom.window.document.querySelector('h3');
        const computedStyle = dom.window.getComputedStyle(customHeader);

        expect(computedStyle.color).to.equal('green');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});