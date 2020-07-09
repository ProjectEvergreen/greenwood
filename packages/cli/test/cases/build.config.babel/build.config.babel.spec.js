/*
 * Use Case
 * Run Greenwood with a custom babel config
 *
 * User Result
 * Should generate and fail to build a bare bones greenwood application using a purpose built babel config
 *
 * User Command
 * greenwood build
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     hello.md
 *     index.md
 */
const path = require('path');
const { JSDOM } = require('jsdom');
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom babel configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('index page should not compile properly', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });
  
      it('should not contain any components within eve-app', function() {
        // prove that our custom broken babel config is being used
        const outlet = dom.window.document.querySelector('body > body-app').innerHTML;
        expect(outlet).to.equal('');
      });

    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});