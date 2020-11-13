/*
 * Use Case
 * Run Greenwood build command with no config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
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
  const LABEL = 'Default Greenwood Configuration and Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    
    // TODO runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);
  
    describe('Default output for index.html', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have a <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;
  
        expect(title).to.be.equal('My App');
      });

      it('should have expected tag in the <body>', function() {
        const title = dom.window.document.querySelector('body h1').textContent;
  
        expect(title).to.be.equal('Welcome to my website!');
      });

      it('should have expected <content-outlet> tag in the <body>', function() {
        const contentOutlet = dom.window.document.querySelectorAll('body content-outlet');

        expect(contentOutlet.length).to.be.equal(1);
        expect(contentOutlet[0]).to.not.be.undefined;
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('body h1').textContent;

        expect(heading).to.equal('Welcome to my website!');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});