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
import chai from 'chai';
import fs from 'fs';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Nested Directories';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Blog Pages Directory', function() {
      let graph;

      before(async function() {
        graph = JSON.parse(await fs.promises.readFile(path.join(this.context.publicDir, 'graph.json'), 'utf-8'))
          .map(item => {
            return {
              ...item,
              path: item.path.replace(/\\/g, '/')
            };
          });
      });

      it('should have the expected ordering of pages in graph.json', function() {
        expect(graph.length).to.equal(21);
        expect(graph[0].path).to.be.equal('src/pages/blog/2017/03/26/index.md');
        expect(graph[1].path).to.be.equal('src/pages/blog/2017/03/30/index.md');
        expect(graph[2].path).to.be.equal('src/pages/blog/2017/04/10/index.md');
        expect(graph[3].path).to.be.equal('src/pages/blog/2017/04/22/index.md');
        expect(graph[4].path).to.be.equal('src/pages/blog/2017/05/05/index.md');
        expect(graph[5].path).to.be.equal('src/pages/blog/2017/06/07/index.md');
        expect(graph[6].path).to.be.equal('src/pages/blog/2017/09/10/index.md');
        expect(graph[7].path).to.be.equal('src/pages/blog/2017/10/15/index.md');
        expect(graph[8].path).to.be.equal('src/pages/blog/2018/01/24/index.md');
        expect(graph[9].path).to.be.equal('src/pages/blog/2018/05/16/index.md');
        expect(graph[10].path).to.be.equal('src/pages/blog/2018/06/06/index.md');
        expect(graph[11].path).to.be.equal('src/pages/blog/2018/09/26/index.md');
        expect(graph[12].path).to.be.equal('src/pages/blog/2018/10/28/index.md');
        expect(graph[13].path).to.be.equal('src/pages/blog/2018/11/19/index.md');
        expect(graph[14].path).to.be.equal('src/pages/blog/2019/11/11/index.md');
        expect(graph[15].path).to.be.equal('src/pages/blog/2020/04/07/index.md');
        expect(graph[16].path).to.be.equal('src/pages/blog/2020/08/15/index.md');
        expect(graph[17].path).to.be.equal('src/pages/blog/2020/10/28/index.md');
        expect(graph[18].path).to.be.equal('src/pages/blog/index.md');
        expect(graph[19].path).to.be.equal('src/pages/index.html');
        expect(graph[20].path).to.be.equal('404.html');
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
          const outputpath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputpath)).to.be.true;
        });
      });

      it('should have the expected pages for 2018 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2018') > 0;
        }).forEach((page) => {
          const outputpath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputpath)).to.be.true;
        });
      });

      it('should have the expected pages for 2019 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2019') > 0;
        }).forEach((page) => {
          const outputpath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputpath)).to.be.true;
        });
      });

      it('should have the expected pages for 2020 blog pages', function() {
        graph.filter((page) => {
          return page.route.indexOf('2020') > 0;
        }).forEach((page) => {
          const outputpath = path.join(this.context.publicDir, page.route, 'index.html');
          expect(fs.existsSync(outputpath)).to.be.true;
        });
      });

      it('should have the expected content for each blog page', function() {
        graph.filter((page) => {
          return page.route.indexOf(/\/blog\/[0-9]{4}/) > 0;
        }).forEach((page) => {
          const contents = fs.readFileSync(path.join(this.context.publicDir, page.route, 'index.html'), 'utf-8');
          
          expect(contents).to.contain(`<p>This is the post for page ${page.data.date}.</p>`);
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});