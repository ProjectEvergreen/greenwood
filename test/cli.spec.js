const expect = require('chai').expect;
const chai = require('chai').use(require('chai-as-promised'));
const should = chai.should(); // eslint-disable-line
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const TestSetup = require('./setup');
const LocalWebServer = require('local-web-server');

const CONFIG = {
    pagesDir: path.join(__dirname, '../packages/cli/templates/'),
    scratchDir: path.join(__dirname, '..', './.greenwood/'),
    templatesDir: path.join(__dirname, '../packages/cli/templates/'),
    publicDir: path.join(__dirname, '..', './public')
  };

before(async () => {
    setup = new TestSetup();
    await setup.run(['./packages/cli/index.js', '']);
});  

describe('after building greenwood', () => {

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

    describe('when rendered', () => {
        let page;
        const localWebServer = new LocalWebServer();
        const server = localWebServer.listen({
            port: '8081',
            https: false,
            directory: CONFIG.publicDir,
            spa: 'index.html'
          });

        before(async() => {
            page = await browser.newPage();
            await page.goto('http://127.0.0.1:8081');
        });

        it('should display the hello world heading', async () => {
            const head = await page.$eval('h1', el => el.innerHTML);
            expect(head).to.equal('Greenwood');
        });

        it('should display the hello world text', async () => {
            const head = await page.$eval('div', el => el.innerText);
            expect(head).to.equal('\n        This is the home page built by Greenwood. Make your own pages in src/pages/index.js!\n      ');
        });
    });
});

after(async() => {
    await fs.remove(CONFIG.publicDir);
    await fs.remove(CONFIG.scratchDir);
});