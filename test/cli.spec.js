const expect = require('chai').expect;
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const TestSetup = require('./setup');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const CONTEXT = {
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
    expect(fs.existsSync(CONTEXT.publicDir)).to.be.true;
  });

  describe('public directory output', () => {  
    it('should output a single index.html file (home page)', () => {
      expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
    });
  
    it('should output one JS bundle file', async () => {
      expect(await glob.promise(path.join(CONTEXT.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
    });
  
    it('should create a default hello page directory', () => {
      expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello'))).to.be.true;
    });

    describe('default generated hello page directory', () => {
      const defaultHeading = 'Hello World';
      const defaultBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, 'hello/index.html'));
      });

      it('should output an index.html file within the default hello page directory', () => {
        expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', async() => {
        const heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;
    
        expect(heading).to.equal(defaultHeading);
      });
    
      it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
        let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;
    
        expect(paragraph).to.equal(defaultBody);
      });
    });
  });

  afterEach(async() => {
    await fs.remove(CONTEXT.usrSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});

describe('building greenwood with a user workspace w/custom nested pages directories', () => {

  beforeEach(async() => {
    setup = new TestSetup();
    // copy test app
    await fs.copy(CONTEXT.testApp, CONTEXT.usrSrc);
    await setup.run(['./packages/cli/index.js', 'build']);
  });

  it('should output one JS bundle', async() => {
    expect(await glob.promise(path.join(CONTEXT.publicDir, './**/index.*.bundle.js'))).to.have.lengthOf(1);
  });
  
  it('should contain a nested blog page directory', () => {
    expect(fs.existsSync(path.join(CONTEXT.publicDir, 'blog', '20190326'))).to.be.true;
  });

  describe('nested generated blog page directory', () => {
    const defaultHeading = 'Blog Page';
    const defaultBody = 'This is the blog page built by Greenwood.';
    const blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html');
    let dom;

    beforeEach(async() => {
      dom = await JSDOM.fromFile(blogPageHtmlPath);
    });

    it('should contain a nested blog page with an index html file', () => {
      expect(fs.existsSync(blogPageHtmlPath)).to.be.true;
    });

    it('should have the expected heading text within the blog page in the blog directory', async() => {
      const heading = dom.window.document.querySelector('h3.wc-md-blog').textContent;
  
      expect(heading).to.equal(defaultHeading);
    });
  
    it('should have the expected paragraph text within the blog page in the blog directory', async() => {
      let paragraph = dom.window.document.querySelector('p.wc-md-blog').textContent;
  
      expect(paragraph).to.equal(defaultBody);
    });
  });

  afterEach(async() => {
    await fs.remove(CONTEXT.usrSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});

// TODO - https://github.com/ProjectEvergreen/greenwood/issues/32
// describe('building greenwood with a user workspace w/custom app-template override', () => {

// });

// TODO - https://github.com/ProjectEvergreen/greenwood/issues/30
// describe('building greenwood with a user workspace w/custom page-template override', () => {

// });

describe('building greenwood with error handling for app and page templates', () => {
  beforeEach(async () => {
    setup = new TestSetup();

    // create empty template directory
    await fs.mkdirSync(CONTEXT.usrSrc);
    await fs.mkdirSync(CONTEXT.usrTemplate);
  });

  it('should display an error if page-template.js is missing', async() => {
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have a page template defined. ");
    });
  });

  it('should display an error if app-template.js is missing', async () => {
    // add blank page-template
    await fs.writeFileSync(path.join(CONTEXT.usrTemplate, 'page-template.js'), '');
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have an app template defined. ");            
    });
  });

  afterEach(async() => {
    await fs.remove(CONTEXT.usrSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});