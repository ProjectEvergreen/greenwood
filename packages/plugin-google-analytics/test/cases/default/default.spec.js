/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin with default options.
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
 *       analyticsId: 'UA-123456-1'
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

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Google Analytics Plugin with default options and Default Workspace';
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

    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Initialization script at the end of the <body> tag', function() {
      let inlineScript;

      beforeEach(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const scriptTags = dom.window.document.querySelectorAll('head script');

        inlineScript = Array.prototype.slice.call(scriptTags).filter(script => {
          return !script.src;
        });

      });

      it('should be one inline <script> tag', function() {
        expect(inlineScript.length).to.be.equal(1);
      });

      it('should have the expected code with users analyicsId', function() {
        const expectedContent = `
            var getOutboundLink = function(url) {
              gtag('event', 'click', {
                'event_category': 'outbound',
                'event_label': url,
                'transport_type': 'beacon',
                'event_callback': function(){document.location = url;}
              });
            }

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${mockAnalyticsId}', { 'anonymize_ip': true });
            gtag('config', '${mockAnalyticsId}');
        `;

        expect(inlineScript[0].textContent).to.contain(expectedContent);
      });
    });

    describe('Tracking script at the end of the <body> tag', function() {
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