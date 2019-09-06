/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin.
 * 
 * Uaer Result
 * Should generate a bare bones Greenwood build with certain plugins injected into index.html.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   plugins: [{
 *     type: 'index',
 *     provider: () => {
 *       return {
 *         hookAnalytics: `
 *           <!-- Google Analytics setup script -->
 *         `
 *       };
 *     }
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

describe.only('Build Greenwood With: ', async function() {
  const LABEL = 'Google Analytics Plugin and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
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
        const scriptTags = dom.window.document.querySelectorAll('body eve-app ~ script');

        inlineScript = Array.prototype.slice.call(scriptTags).filter(script => {
          return !script.src;
        });

      });

      it('should be one inline <script> tag', function() {
        expect(inlineScript.length).to.be.equal(1);
      });

      it('should have the expected code with users analyicsId', function() {
        const expectedContent = `
            window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
            ga('create', 'UA-123456', 'auto');
            ga('send', 'pageview');
        `;

        expect(inlineScript[0].textContent).to.contain(expectedContent);
      });
    });

    describe('Tracking script at the end of the <body> tag', function() {
      let trackingScript; 

      beforeEach(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const scriptTags = dom.window.document.querySelectorAll('body eve-app ~ script');
        
        trackingScript = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.src === 'https://www.google-analytics.com/analytics.js';
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