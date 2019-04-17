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

const whenSerialized = (head, par) => {
  describe('when serialized', async () => {
    let dom;

    before(async() => {
      dom = await JSDOM.fromFile(path.resolve(__dirname, '..', './public/hello/index.html'));
    });

    it('should display the hello world heading', async () => {
      let heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;

      expect(heading).to.equal(head);
    });

    it('should display the hello world text', async () => {
      let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;

      expect(paragraph).to.equal(par);
    });
  });
};

describe('after building greenwood', () => {

  before(async () => {
    setup = new TestSetup();
    await setup.run(['./packages/cli/index.js', 'build']);
  });  

  it('should create a new public directory', () => {
    expect(fs.existsSync(CONFIG.publicDir)).to.be.true;
  });

  describe('within the public folder', () => {
    it('should contain an index.html file', () => {
      expect(fs.existsSync(path.join(CONFIG.publicDir, './index.html'))).to.be.true;
    });
    it('should contain a js bundle file', async () => {
      expect(await glob.promise(path.join(CONFIG.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
    });
    it('should contain a hello directory', () => {
      expect(fs.existsSync(path.join(CONFIG.publicDir, './hello'))).to.be.true;
    });
    it('should contain an index.html file within the hello world directory', () => {
      expect(fs.existsSync(path.join(CONFIG.publicDir, './hello', './index.html'))).to.be.true;
    });
  });

  describe('using default greenwood template', () => {
    whenSerialized('Hello World', 'This is an example page built by Greenwood.  Make your own in src/pages!');
    after(async() => {
      await fs.remove(CONFIG.publicDir);
      await fs.remove(CONFIG.scratchDir);
    });
  });

  describe('using a user workspace directory', () => {
    before(async() => {
      // copy test app
      await fs.copy(CONFIG.testApp, CONFIG.usrSrc);
      await setup.run(['./packages/cli/index.js', 'build']);
    });
    describe('with a correct user templates directory', () => {
      whenSerialized('Test App', 'This is a test app using a custom user template!');
    });
    describe('with a nested page directory', () => {
      it('should contain a nested blog directory', () => {
        expect(fs.existsSync(path.join(CONFIG.publicDir, 'blog', '20190326'))).to.be.true;
      });
      it('should contain a nested blog index html file', () => {
        expect(fs.existsSync(path.join(CONFIG.publicDir, 'blog', '20190326', 'index.html'))).to.be.true;
      });
    });
    after(async() => {
      await fs.remove(CONFIG.usrSrc);
      await fs.remove(CONFIG.publicDir);
      await fs.remove(CONFIG.scratchDir);
    });
  }); 
});