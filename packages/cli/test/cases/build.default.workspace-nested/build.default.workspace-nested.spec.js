/*
 * Use Case
 * Run Greenwood with default config and nested directories in workspace.
 *
 * Result
 * Test for correctly nested generated output.
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
 *       2019/
 *         index.md
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Nested Directories';
  let setup;

  before(async function() {
    setup = new TestBed(true);
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'not-found', 'index'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    it('should create a default blog page directory', function() {
      expect(fs.existsSync(path.join(this.context.publicDir, './blog'))).to.be.true;
    });

    describe('Custom blog page directory', function() {
      let dom, graph;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog/2019/11/11/index.html'));
        graph = require(path.join(this.context.publicDir, 'graph.json'));
      });

      // pages/blog/2017/04/10/index.md => 5
      // pages/blog/2017/04/22/index.md => 4
      // 0 ./blog/2017/03/26/index.md
      // 1 ./blog/2017/03/30/index.md
      // 2 ./blog/2017/04/10/index.md
      // 3 ./blog/2017/04/22/index.md
      // 4 ./blog/2017/05/05/index.md
      // 5 ./blog/2017/06/07/index.md
      // 6 ./blog/2017/09/10/index.md
      // 7 ./blog/2017/10/15/index.md
      // 8 ./blog/2018/01/24/index.md
      // 9 ./blog/2018/05/16/index.md
      // 10 ./blog/2018/06/06/index.md
      // 11 ./blog/2018/09/26/index.md
      // 12 ./blog/2018/10/28/index.md
      // 13 ./blog/2018/11/19/index.md
      // 14 ./blog/2019/11/11/index.md
      // 15 ./blog/2020/04/07/index.md
      // 16 ./blog/2020/08/15/index.md
      // 17 ./blog/2020/10/28/index.md
      // 18 ./blog/index.md
      // 19 ./index.md

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

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog/2019/11/11/index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', function() {
        const heading = dom.window.document.querySelector('h1').textContent;

        expect(heading).to.equal('Welcome to my website!');
      });

      it('should have the expected paragraph text within the hello example page in the hello directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal('These are the blog for 11.11.2019.');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});