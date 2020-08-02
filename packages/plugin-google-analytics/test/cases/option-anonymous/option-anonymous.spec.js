/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin with IP anonymization set to false.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with Google Analytics tracking snippet injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const googleAnalyticsPlugin = require('@greenwod/plugin-google-analytics');
 *
 * {
 *   plugins: [{
 *     ...googleAnalyticsPlugin({
 *       analyticsId: 'UA-123456-1',
 *       anonymouse: false
 *     })
 *  }]
 *
 * }
 *
 * User Workspace
 * Greenwood default (src/)
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Google Analytics Plugin with IP Anonymization tracking set to false and Default Workspace';
  const mockAnalyticsId = 'UA-123456-1';

  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found', 'hello'], LABEL);

    describe('Initialization script', function() {
      let scriptSrcTags = [];
      let inlineScripts = [];
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should be one inline <script> tag in the <head>', function() {
        const headTags = dom.window.document.querySelectorAll('head script');

        inlineScripts = Array.prototype.slice.call(headTags).filter(script => {
          return !script.src;
        });

        scriptSrcTags = Array.prototype.slice.call(headTags).filter(script => {
          return script.src && script.src.indexOf('google') >= 0;
        });

        expect(scriptSrcTags.length).to.be.equal(1);
      });

      it('should be one inline <script> tag in the <head>', function() {
        expect(inlineScripts.length).to.be.equal(1);
      });

      it('should be one <script> tag in the <head>', function() {
        expect(scriptSrcTags.length).to.be.equal(1);
      });

      it('should have the expected code with users analyicsId', function() {
        const expectedContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${mockAnalyticsId}', { 'anonymize_ip': false });
            gtag('config', '${mockAnalyticsId}');
        `;

        expect(inlineScripts[0].textContent).to.contain(expectedContent);
      });

      it('should not add more <script> tags to the body', function() {
        const bodyTags = dom.window.document.querySelectorAll('body script');

        expect(bodyTags.length).to.be.equal(0);
      });
    });

    describe('Tracking script', function() {
      let trackingScript;

      beforeEach(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const scriptTags = dom.window.document.querySelectorAll('head script');

        trackingScript = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.src === `https://www.googletagmanager.com/gtag/js?id=${mockAnalyticsId}`;
        });
      });

      it('should have one <script> tag for loading the Google Analytics tracker', function() {
        expect(trackingScript.length).to.be.equal(1);
      });

      it('should be an async <script> tag for loading the Google Analytics tracker', function() {
        const isAsync = trackingScript[0].async !== null;

        expect(isAsync).to.be.equal(true);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});