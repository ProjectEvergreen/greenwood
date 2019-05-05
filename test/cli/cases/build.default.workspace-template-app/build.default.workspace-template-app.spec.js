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
 *     app-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', () => {
  let setup;
  let context;

  before(async () => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });

  describe('Default Greenwood Configuration and Workspace w/Custom App Template', () => {
    let dom;

    before(async() => {
      await setup.runGreenwoodCommand('build');

      dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
    });

    it('should output a single index.html file using our custom app template', () => {
      expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
    });

    it('should have the specific element we added as part of our custom app template', () => {
      const customParagraph = dom.window.document.querySelector('p#custom-app-template').textContent;
      
      expect(customParagraph).to.equal('My Custom App Template');
    });
  });
    
  after(async () => {
    setup.teardownTestBed();
  });
  
});