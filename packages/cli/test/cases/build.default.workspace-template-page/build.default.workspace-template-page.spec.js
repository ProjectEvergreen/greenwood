/*
 * Use Case
 * Run Greenwood build command with no config and custom page template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   templates/
 *     page-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Page Template';
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

    describe('Custom Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific element we added as part of our custom page template', function() {
        const customElement = dom.window.document.querySelectorAll('div.owen-test');

        expect(customElement.length).to.equal(1);
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });
});