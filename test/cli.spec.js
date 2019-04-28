const expect = require('chai').expect;
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const TestSetup = require('./setup');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

describe('building greenwood with default context (no user workspace)', () => {

  before(async () => {
    setup = new TestSetup();
    CONTEXT = await setup.init();

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

    describe('default generated index page in public directory', () => {
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, 'index.html'));
      });

      it('should output an index.html file within the root public directory', () => {
        expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the index page in the public directory', async() => {
        const heading = dom.window.document.querySelector('h3.wc-md-index').textContent;
    
        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', async() => {
        let paragraph = dom.window.document.querySelector('p.wc-md-index').textContent;
    
        expect(paragraph).to.equal(indexPageBody);
      });
    });

    it('should create a default hello page directory', () => {
      expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello'))).to.be.true;
    });

    describe('default generated hello page directory', () => {
      const helloPageHeading = 'Hello World';
      const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, './hello', './index.html'));
      });

      it('should output an index.html file within the default hello page directory', () => {
        expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', async() => {
        const heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;
    
        expect(heading).to.equal(helloPageHeading);
      });
    
      it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
        let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;
    
        expect(paragraph).to.equal(helloPageBody);
      });
    });
  });

  after(async() => {
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});

describe('building greenwood with a user workspace w/custom nested pages directories', () => {
  
  before(async() => {
    setup = new TestSetup();
    CONTEXT = await setup.init();
    // copy test app
    await fs.copy(CONTEXT.testApp, CONTEXT.userSrc);
    await setup.run(['./packages/cli/index.js', 'build']);
    
    blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html'); 
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

  after(async() => {
    await fs.remove(CONTEXT.userSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});

// TODO - https://github.com/ProjectEvergreen/greenwood/issues/32
// describe('building greenwood with a user workspace w/custom app-template override', () => {

// });

describe('building greenwood with a user workspace w/custom front-matter override', () => {

  before(async () => {
    setup = new TestSetup();
    CONTEXT = await setup.init();

    // copy custom-fm app
    await fs.copy(CONTEXT.customFMApp, CONTEXT.userSrc);
    await setup.run(['./packages/cli/index.js', 'build']);

    indexPageHtmlPath = path.join(CONTEXT.publicDir, 'index.html'); 
    blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', 'index.html'); 
  });

  describe('using a custom label', () => {
    const defaultIndexHeading = 'Home Page';
    const defaultIndexBody = 'This is the blog home page built by Greenwood.';
    let dom;
    
    beforeEach(async() => {
      dom = await JSDOM.fromFile(indexPageHtmlPath);
    });
    
    it('should contain an index html file', () => {
      expect(fs.existsSync(indexPageHtmlPath)).to.be.true;
    });
  
    it('should have the expected heading text within the index page in the public directory', async() => {
      const heading = dom.window.document.querySelector('h3.wc-md-home').textContent;
  
      expect(heading).to.equal(defaultIndexHeading);
    });

    it('should have the expected paragraph text within the index page in the public directory', async() => {
      let paragraph = dom.window.document.querySelector('p.wc-md-home').textContent;

      expect(paragraph).to.equal(defaultIndexBody);
    });
  });
  
  describe('using a custom template with random label', () => {
    const defaultBlogHeading = 'Blog Page';
    const defaultBlogBody = 'This is the blog page built by Greenwood.';
    let dom;
    
    beforeEach(async() => {
      dom = await JSDOM.fromFile(blogPageHtmlPath);
    });
    it('should contain a nested blog page with an index html file', () => {
      expect(fs.existsSync(blogPageHtmlPath)).to.be.true;
    });

    it('should have the expected heading text within the blog page in the blog directory', async() => {
      const heading = dom.window.document.querySelector('h3').textContent;

      expect(heading).to.equal(defaultBlogHeading);
    });

    it('should have the expected paragraph text within the blog page in the blog directory', async() => {
      let paragraph = dom.window.document.querySelector('p').textContent;

      expect(paragraph).to.equal(defaultBlogBody);
    });

    it('should have the expected blog-template\'s blog-content class', async() => {
      let layout = dom.window.document.querySelector('.blog-content');

      expect(layout).to.not.equal(null);
    });

  });

  after(async() => {
    await fs.remove(CONTEXT.userSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });
});

describe('building greenwood with error handling for app and page templates', () => {
  before(async () => {
    setup = new TestSetup();
    CONTEXT = await setup.init();

    // create empty template directory
    await fs.mkdirSync(CONTEXT.userSrc);
    await fs.mkdirSync(CONTEXT.userTemplates);
  });

  it('should display an error if page-template.js is missing', async() => {
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have a page template defined. ");
    });
  });

  it('should display an error if app-template.js is missing', async () => {
    // add blank page-template
    await fs.writeFileSync(path.join(CONTEXT.userTemplates, 'page-template.js'), '');
    await setup.run(['./packages/cli/index.js'], '').catch((err) => {
      expect(err).to.contain("It looks like you don't have an app template defined. ");            
    });
  });

  after(async() => {
    await fs.remove(CONTEXT.userSrc);
    await fs.remove(CONTEXT.publicDir);
    await fs.remove(CONTEXT.scratchDir);
  });

});