const expect = require('chai').expect;
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const TestSetup = require('./setup');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const CONFIG = {
  pagesDir: path.join(__dirname, '../packages/cli/templates/'),
  scratchDir: path.join(__dirname, '..', './.greenwood/'),
  templatesDir: path.join(__dirname, '../packages/cli/templates/'),
  publicDir: path.join(__dirname, '..', './public'),
  testApp: path.join(__dirname, 'fixtures', 'mock-app', 'src'),
  usrSrc: path.join(__dirname, '..', 'src'),
  usrTemplate: path.join(__dirname, '..', 'src', 'templates')
};

describe('building greenwood with default context (no user workspace)', () => {
  
  beforeEach(async () => {
    setup = new TestSetup();
    await setup.run(['./packages/cli/index.js', 'build']);
  });

  it('should create a public directory', () => {
    expect(fs.existsSync(CONFIG.publicDir)).to.be.true;
  });

  describe('public directory output', () => {  
    it('should output a single index.html file (home page)', () => {
      expect(fs.existsSync(path.join(CONFIG.publicDir, './index.html'))).to.be.true;
    });
  
    it('should output one JS bundle file', async () => {
      expect(await glob.promise(path.join(CONFIG.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
    });
  
    it('should create a default hello page directory', () => {
      expect(fs.existsSync(path.join(CONFIG.publicDir, './hello'))).to.be.true;
    });

    xdescribe('default generated hello page contents', () => {
      const defaultHeading = 'Hello World';
      const defaultBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(CONFIG.publicDir, 'hello/index.html'));
      });

      it('should output an index.html file within the default hello page directory', () => {
        expect(fs.existsSync(path.join(CONFIG.publicDir, './hello', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', async() => {
        const heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;
    
        expect(heading).to.equal(defaultHeading);
      });
    
      it('should have the expected heading text within the hello example page in the hello directory', async() => {
        let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;
    
        expect(paragraph).to.equal(defaultBody);
      });
    });
  });

  afterEach(async() => {
    await fs.remove(CONFIG.usrSrc);
    await fs.remove(CONFIG.publicDir);
    await fs.remove(CONFIG.scratchDir);
  });

});

xdescribe('building greenwood with a user workspace w/custom and nested pages directories', () => {

  beforeEach(async() => {
    // copy test app
    await fs.copy(CONFIG.testApp, CONFIG.usrSrc);
    await setup.run(['./packages/cli/index.js', 'build']);
  });

  it('should contain a nested blog page directory', () => {
    expect(fs.existsSync(path.join(CONFIG.publicDir, 'blog', '20190326'))).to.be.true;
  });

  it('should contain a nested blog page with an index html file', () => {
    expect(fs.existsSync(path.join(CONFIG.publicDir, 'blog', '20190326', 'index.html'))).to.be.true;
  });

  it('should have the expected text within the hello world example page in the hello world directory', () => {
    whenSerialized('Hello World', 'This is an example page built by Greenwood.  Make your own in src/pages!');
    after(async() => {
      await fs.remove(CONFIG.publicDir);
      await fs.remove(CONFIG.scratchDir);
    });
  });

  // TODO
  // it('should have X number of JS bundles', () => {

  // });
  
  // TODO
  // it('should have other things to test for?', () => {

  // });

  afterEach(async() => {
    await fs.remove(CONFIG.usrSrc);
    await fs.remove(CONFIG.publicDir);
    await fs.remove(CONFIG.scratchDir);
  });

});

// TODO - https://github.com/ProjectEvergreen/greenwood/issues/32
// describe('building greenwood with a user workspace w/custom app-template override', () => {

// });

// TODO - https://github.com/ProjectEvergreen/greenwood/issues/30
// describe('building greenwood with a user workspace w/custom page-template override', () => {

// });

xdescribe('building greenwood with error handling for app and page templates', () => {
  beforeEach(async () => {
    setup = new TestSetup();

    // create empty template directory
    await fs.mkdirSync(CONFIG.usrSrc);
    await fs.mkdirSync(CONFIG.usrTemplate);
  });

  it('should display an error if page-template.js is missing', async() => {
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have a page template defined. ");
    });
  });

  it('should display an error if app-template.js is missing', async () => {
    // add blank page-template
    await fs.writeFileSync(path.join(CONFIG.usrTemplate, 'page-template.js'), '');
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have an app template defined. ");            
    });
  });

  afterEach(async() => {
    await fs.remove(CONFIG.usrSrc);
    await fs.remove(CONFIG.publicDir);
    await fs.remove(CONFIG.scratchDir);
  });

});