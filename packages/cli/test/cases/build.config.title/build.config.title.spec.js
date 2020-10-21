/*
 * Use Case
 * Run Greenwood with string title in config and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom title in header
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   title: 'My Custom Greenwood App'
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     index.md
 *     hello.md
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

const configTitle = require('./greenwood.config').title;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Title Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    
    // TODO runSmokeTest(['public', 'not-found', 'hello'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom Title from Configuration', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have our custom config <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(configTitle);
      });
    });

    describe('Custom Front-Matter Title', function() {
      const pageTitle = 'About Page';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', './index.html'));
      });

      it('should output an index.html file within the about page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', './index.html'))).to.be.true;
      });

      it('should have a overridden meta <title> tag in the <head> using markdown front-matter', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(`${configTitle} - ${pageTitle}`);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});