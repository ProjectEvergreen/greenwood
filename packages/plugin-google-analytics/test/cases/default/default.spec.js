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
 *     googleAnalyticsPlugin({
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
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Google Analytics Plugin with default options and Default Workspace';
  const mockAnalyticsId = 'UA-123456-1';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('Initialization script', function() {
      let inlineScript = [];
      let scriptSrcTags = [];

      before(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const scriptTags = dom.window.document.querySelectorAll('head script');

        inlineScript = Array.prototype.slice.call(scriptTags).filter(script => {
          return !script.src && !script.getAttribute('data-state');
        });

        scriptSrcTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.src && script.src.indexOf('google') >= 0;
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
                'transport_type': 'beacon'
              });
            }
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${mockAnalyticsId}', { 'anonymize_ip': true });
        `;

        expect(inlineScript[0].textContent).to.contain(expectedContent);
      });

      it('should only have one external Google script tag', function() {
        expect(scriptSrcTags.length).to.be.equal(1);
      });
    });

    describe('Link Preconnect', function() {
      let linkTag;

      before(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const linkTags = dom.window.document.querySelectorAll('head link');

        linkTag = Array.prototype.slice.call(linkTags).filter(link => {
          return link.href === 'https://www.google-analytics.com/';
        });
      });

      it('should have one <link> tag for prefetching from the Google Analytics domain', function() {
        expect(linkTag.length).to.be.equal(1);
      });

      it('should have one <link> tag with rel preconnect attribute set', function() {
        expect(linkTag[0].rel).to.be.equal('preconnect');
      });
    });

    describe('Tracking script', function() {
      let trackingScript;

      before(async function() {
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
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});