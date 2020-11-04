/*
 * Use Case
 * Run Greenwood build command with no config and custom app template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom app template.
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
 *     app.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'not-found', 'hello'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom App Template', function() {
      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom app template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific element we added as part of our custom app template', function() {
        const customParagraph = dom.window.document.querySelector('body p').textContent;

        expect(customParagraph).to.equal('My Custom App Template');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});