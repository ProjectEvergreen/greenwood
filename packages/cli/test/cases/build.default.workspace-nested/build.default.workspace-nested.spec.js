/*
 * Use Case
 * Run Greenwood with default config and nested directories in workspace with lots of nested pages.
 *
 * Result
 * Test for correctly ordered graph.json and pages output, which by default should mimic 
 * the filesystem order by default.
 *
 * Command
 * greenwood build
 *
 * User Config
 * None (Greenwood default)
 *
 * User Workspace
 * src/
 *   pages/
 *     blog/
 *       2017/
 *         03/26/index.md
 *         03/30/index.md
 *         04/10/index.md
 *         04/22/index.md
 *         05/05/index.md
 *         06/07/index.md
 *         09/10/index.md
 *         10/15/index.md
 *       2018/
 *         01/24/index.md
 *         05/16/index.md
 *         06/06/index.md
 *         09/26/index.md
 *         10/28/index.md
 *         11/19/index.md
 *       2019/
 *         11/11/index.md
 *       2020/
 *         04/07/index.md
 *         08/15/index.md
 *         10/28/index.md
 *     index.md
 *   index.md
 */
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Nested Directories';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'not-found', 'index'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    describe('Blog Pages Directory', function() {
      let graph;

      beforeEach(async function() {
        graph = require(path.join(this.context.publicDir, 'graph.json'));
      });

      it('should have the expected ordering of pages in graph.json', function() {
        expect(graph.length).to.equal(20);
        expect(graph[0].filePath).to.contain('src/pages/blog/2017/03/26/index.md');
        expect(graph[1].filePath).to.contain('src/pages/blog/2017/03/30/index.md');
        expect(graph[2].filePath).to.contain('src/pages/blog/2017/04/10/index.md');
        expect(graph[3].filePath).to.contain('src/pages/blog/2017/04/22/index.md');
        expect(graph[4].filePath).to.contain('src/pages/blog/2017/05/05/index.md');
        expect(graph[5].filePath).to.contain('src/pages/blog/2017/06/07/index.md');
        expect(graph[6].filePath).to.contain('src/pages/blog/2017/09/10/index.md');
        expect(graph[7].filePath).to.contain('src/pages/blog/2017/10/15/index.md');
        expect(graph[8].filePath).to.contain('src/pages/blog/2018/01/24/index.md');
        expect(graph[9].filePath).to.contain('src/pages/blog/2018/05/16/index.md');
        expect(graph[10].filePath).to.contain('src/pages/blog/2018/06/06/index.md');
        expect(graph[11].filePath).to.contain('src/pages/blog/2018/09/26/index.md');
        expect(graph[12].filePath).to.contain('src/pages/blog/2018/10/28/index.md');
        expect(graph[13].filePath).to.contain('src/pages/blog/2018/11/19/index.md');
        expect(graph[14].filePath).to.contain('src/pages/blog/2019/11/11/index.md');
        expect(graph[15].filePath).to.contain('src/pages/blog/2020/04/07/index.md');
        expect(graph[16].filePath).to.contain('src/pages/blog/2020/08/15/index.md');
        expect(graph[17].filePath).to.contain('src/pages/blog/2020/10/28/index.md');
        expect(graph[18].filePath).to.contain('src/pages/blog/index.md');
        expect(graph[19].filePath).to.contain('src/pages/index.md');
      });

      it('should create a top level blog pages directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './blog'))).to.be.true;
      });
  
      it('should create a directory for each year of blog pages', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog/2017'))).to.be.true;
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog/2018'))).to.be.true;
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog/2019'))).to.be.true;
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog/2020'))).to.be.true;
      });

      it('should have the expected pages for 2017 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2017') > 0;
        }).forEach((page) => {
          const outputFilepath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputFilepath)).to.be.true;
        });
      });

      it('should have the expected pages for 2018 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2018') > 0;
        }).forEach((page) => {
          const outputFilepath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputFilepath)).to.be.true;
        });
      });

      it('should have the expected pages for 2019 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2019') > 0;
        }).forEach((page) => {
          const outputFilepath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputFilepath)).to.be.true;
        });
      });

      it('should have the expected pages for 2020 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2020') > 0;
        }).forEach((page) => {
          const outputFilepath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputFilepath)).to.be.true;
        });
      });

      it('should have the expected content for each blog page', function() {
        graph.filter((page) => {
          return page.route.indexOf('blog') > 0 && page.fileName !== 'index';
        }).forEach((page) => {
          const contents = fs.readFileSync(path.join(this.context.publicDir, page.route, 'index.html'), 'utf-8');
          
          expect(contents).to.contain(`<p>This is the post for page ${page.data.date}.</p>`);
        });
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});