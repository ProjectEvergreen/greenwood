/*
 * Use Case
 * Run Greenwood with and loading different references to node_module types to ensure proper support.
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
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Importing packages from node modules';
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
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        {
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
    
        ...pwaHelpersLibs,
    
        {
          // prism.css
          dir: 'node_modules/prismjs/themes/',
          name: 'prism-tomorrow.css'
        },
    
        {
          // simple.css - included as a non-JavaScript package
          // https://github.com/ProjectEvergreen/greenwood/issues/484
          dir: 'node_modules/simpledotcss/',
          name: 'package.json'
        },
        {
          dir: 'node_modules/simpledotcss/',
          name: 'simple.css'
        }
      ]);
      await runner.runCommand(cliPath, 'build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('<script src="..."> tag in the <head> tag', function() {
      it('should have one <script src="..."> tag for main.js loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/main.*.js/).test(script.src);
        });
        
        expect(mainScriptTags.length).to.be.equal(1);
      });

      it('should have the total expected number of .js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(4);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });

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

    describe('<script> tag with inline code in the <head> tag', function() {
      it('should have one <script> tag with inline code loaded in the <head> tag', function() {
        const scriptTagsInline = dom.window.document.querySelectorAll('head > script:not([src])');
        
        expect(scriptTagsInline.length).to.be.equal(1);
      });

      it('should have the expected lit-element.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'lit-element.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected lit-html.js files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'lit-html.cdc8faae.js'))).to.have.lengthOf(1);
      });

      it('should have the expected inline node_modules content in the inline script', async function() {
        const inlineScriptTag = dom.window.document.querySelector('head > script:not([src])');
        
        expect(inlineScriptTag.textContent).to
          .contain('import"/lit-html.d69ea26f.js";import"/lit-element.ea26fec7.js";document.getElementsByClassName("output-script-inline")[0].innerHTML="script tag module inline"');
      });

      it('should have the expected output from inline <script> tag in the page output', async function() {
        const inlineScriptOutput = dom.window.document.querySelectorAll('body > .output-script-inline');
        
        expect(inlineScriptOutput.length).to.be.equal(1);
        expect(inlineScriptOutput[0].textContent).to.be.equal('script tag module inline');
      });
    });

    describe('<script src="..."> with reference to node_modules/ path in the <head> tag', function() {
      it('should have one <script src="..."> tag for lit-html loaded in the <head> tag', function() {
        const scriptTagsInline = dom.window.document.querySelectorAll('head > script[src]');
        const litScriptTags = Array.prototype.slice.call(scriptTagsInline).filter(script => {
          return (/lit.*.js/).test(script.src);
        });

        expect(litScriptTags.length).to.be.equal(1);
      });

      it('should have the expected lit-html.js files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'lit-html.d69ea26f.js'))).to.have.lengthOf(1);
      });
    });

    describe('<link rel="stylesheet" href="..."> with reference to node_modules/ path in the <head> tag', function() {
      it('should have one <link href="..."> tag in the <head> tag', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
        const prismLinkTag = Array.prototype.slice.call(linkTags).filter(link => {
          return (/prism-tomorrow.*.css/).test(link.href);
        });

        expect(prismLinkTag.length).to.be.equal(1);
      });

      it('should have the expected prism.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'prism-tomorrow.*.css'))).to.have.lengthOf(1);
      });
    });
  });

  after(function() {
    runner.teardown();
  });

});