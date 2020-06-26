/*
 * Use Case
 * Run Greenwood with a custom postcss config
 *
 * User Result
 * Should generate a bare bones Greenwood build with a hello page containing a component with a 
 * @custom-media query
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
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom PostCSS configuration';
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

    describe('Hello page with working @custom-media queries', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './hello/index.html'));
      });

      it('should resolve the correct @custom-media queries for eve-container', function() {
        // check @media (--screen-xs) resolves to @media (max-width:576px) via postcss preset-env: stage 1
        const expectedStyle = 'eve-container .container.eve-container,eve-container ' +
        '.container-fluid.eve-container {\n  margin-right:auto;margin-left:auto;padding-left:15px;' +
        'padding-right:15px\n}\n\n@media (max-width:576px) {\neve-container .container.eve-container ' +
        '{\n  width:calc(100% - 30px)\n}\n\n}\n\n@media (min-width:576px) {\neve-container ' + 
        '.container.eve-container {\n  width:540px\n}\n\n}\n\n@media (min-width:768px) {\neve-container ' + 
        '.container.eve-container {\n  width:720px\n}\n\n}\n\n@media (min-width:992px) {\neve-container ' +
        '.container.eve-container {\n  width:960px\n}\n\n}\n\n@media (min-width:1200px) {\neve-container ' + 
        '.container.eve-container {\n  width:1140px\n}\n\n}';
        const containerStyle = dom.window.document.head.querySelector('style[scope="eve-container"]');
        expect(containerStyle.innerHTML).to.equal(expectedStyle);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});