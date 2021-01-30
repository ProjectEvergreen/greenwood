/*
 * Use Case
 * Run Greenwood with and loading different module types to ensure support for ESM and MJS node modules resolution.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Importing packages from node modules';

  let setup;

  before(async function() {
    setup = new TestBed(true);

    const litElementLibs = (await glob(`${process.cwd()}/node_modules/lit-element/lib/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/lit-element/lib/',
        name: path.basename(lib)
      };
    });
    const litHtmlLibs = (await glob(`${process.cwd()}/node_modules/lit-html/lib/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/lit-html/lib/',
        name: path.basename(lib)
      };
    });
    const lodashLibs = (await glob(`${process.cwd()}/node_modules/lodash-es/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/lodash-es/',
        name: path.basename(lib)
      };
    });
    const pwaHelpersLibs = (await glob(`${process.cwd()}/node_modules/pwa-helpers/*.js`)).map((lib) => {
      return {
        dir: 'node_modules/pwa-helpers/',
        name: path.basename(lib)
      };
    });

    this.context = await setup.setupTestBed(__dirname, [{
      // redux
      dir: 'node_modules/redux/es',
      name: 'redux.mjs'
    }, {
      dir: 'node_modules/redux/',
      name: 'package.json'
    }, {
      dir: 'node_modules/loose-envify/',
      name: 'index.js'
    }, {
      dir: 'node_modules/loose-envify/',
      name: 'package.json'
    }, {
      dir: 'node_modules/js-tokens/',
      name: 'index.js'
    }, {
      dir: 'node_modules/js-tokens/',
      name: 'package.json'
    }, {
      dir: 'node_modules/symbol-observable/es/',
      name: 'index.js'
    }, {
      dir: 'node_modules/symbol-observable/es/',
      name: 'ponyfill.js'
    }, {
      dir: 'node_modules/symbol-observable/',
      name: 'package.json'
    }, {

      // lit-element (+ lit-html)
      dir: 'node_modules/lit-element/',
      name: 'lit-element.js'
    }, {
      dir: 'node_modules/lit-element/',
      name: 'package.json'
    },

    ...litElementLibs, 
    
    {
      dir: 'node_modules/lit-html/',
      name: 'lit-html.js'
    }, {
      dir: 'node_modules/lit-html/',
      name: 'package.json'
    },
    
    ...litHtmlLibs,
    
    {
      // lodash-es
      dir: 'node_modules/lodash-es/',
      name: 'lodash.js'
    }, {
      dir: 'node_modules/lodash-es/',
      name: 'package.json'
    },

    ...lodashLibs,

    {
      // pwa-helpers
      dir: 'node_modules/pwa-helpers/',
      name: 'package.json'
    },

    ...pwaHelpersLibs

    ]);
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await setup.runGreenwoodCommand('build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('Script tag in the <head> tag', function() {
      it('should have one <script> tag for main.js loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const mainScriptTag = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/main.*.js/).test(script.src);
        });
        
        expect(mainScriptTag.length).to.be.equal(1);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });
    });

    describe('exported node_module content in the body of the page', function() {
      it('should have the expected output from main.js for lit-element (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-lit');
        
        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from lit-element Y2xhc3MgTGl0RWxl');
      });

      it('should have the expected output from main.js for lodash-es (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-lodash');
        
        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from lodash-es {"a":1,"b":2}');
      });

      it('should have the expected output from main.js for pwa-helpers (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-pwa');
        
        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from pwa-helpers KGNvbWJpbmVSZWR1');
      });

      it('should have the expected output from main.js for Redux (MJS) in the page output', async function() {
        const reduxOutput = dom.window.document.querySelectorAll('body > .output-redux');
        
        expect(reduxOutput.length).to.be.equal(1);
        expect(reduxOutput[0].textContent).to.be.equal('import from redux ZnVuY3Rpb24gbyh0');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});