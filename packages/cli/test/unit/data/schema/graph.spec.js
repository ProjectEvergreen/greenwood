/*
 * Use Case
 * Run Greenwood with empty config object and default workspace.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js)
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {}
 *
 * User Workspace
 * Greenwood default (src/)
 */
const expect = require('chai').expect;
const GRAPH_MOCK = require('../mocks/graph');
const { graphResolvers } = require('../../../../src/data/schema/graph');

describe('Unit Test: Data', function() {

  describe('Schema', function() {

    describe('Graph', function() {

      describe('getPagesFromGraph', function() {
        let pages = [];

        before(async function() {
          pages = await graphResolvers.Query.graph(undefined, {}, GRAPH_MOCK);
        });

        it('should have 27 pages', function() {
          expect(pages.length).to.equal(27);
        });

        it('should have all expected properties for each page', function() {
          pages.forEach(function(page) {
            expect(page.id).to.exist;
            expect(page.filePath).to.exist;
            expect(page.fileName).to.exist;
            expect(page.template).to.exist;
            expect(page.title).to.exist;
            expect(page.link).to.exist;
          });
        });

        //       pages  [ { id: '37b24fd9f163e7b',
        //   filePath: './index.md',
        //   fileName: 'index',
        //   template: 'home',
        //   title: '',
        //   link: '/' },
        // { id: '94c871662fe47e5',
        //   filePath: './about/community.md',
        //   fileName: 'community',
        //   template: 'page',
        //   title: 'About',
        //   link: '/about/community' },
        // { id: '856848d74d8428b',
        //   filePath: './about/features.md',
        //   fileName: 'features',
        //   template: 'page',
        //   title: 'About',
        //   link: '/about/features' },
        // { id: 'f7f7b27e3c27d0c',
        //   filePath: './about/how-it-works.md',
        //   fileName: 'how-it-works',
        //   template: 'page',
        //   title: 'About',
        //   link: '/about/how-it-works' },
        // { id: '9e1ec40126cbaa1',
        //   filePath: './about/goals.md',
        //   fileName: 'goals',
        //   template: 'page',
        //   title: 'About',
        //   link: '/about/goals' },
        // { id: 'about',
        //   filePath: './about/index.md',
        //   fileName: 'index',
        //   template: 'page',
        //   title: 'About',
        //   link: '/about/' },
        // { id: '41d241788aba406',
        //   filePath: './docs/component-model.md',
        //   fileName: 'component-model',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/component-model' },
        // { id: 'b8027b72fecbdf6',
        //   filePath: './docs/configuration.md',
        //   fileName: 'configuration',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/configuration' },
        // { id: '4ed3ee4d104185e',
        //   filePath: './docs/index.md',
        //   fileName: 'index',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/' },
        // { id: '0441281c8197941',
        //   filePath: './docs/front-matter.md',
        //   fileName: 'front-matter',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/front-matter' },
        // { id: 'ff00fdc5a5bb79e',
        //   filePath: './docs/layouts.md',
        //   fileName: 'layouts',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/layouts' },
        // { id: '6ec677142cf4506',
        //   filePath: './docs/css-and-images.md',
        //   fileName: 'css-and-images',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/css-and-images' },
        // { id: '5f2e96ac1d461f1',
        //   filePath: './docs/tech-stack.md',
        //   fileName: 'tech-stack',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/tech-stack' },
        // { id: '5436f1acd7a0297',
        //   filePath: './getting-started/branding.md',
        //   fileName: 'branding',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/branding' },
        // { id: '878f45b3dea2a2e',
        //   filePath: './getting-started/creating-content.md',
        //   fileName: 'creating-content',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/creating-content' },
        // { id: 'd16333ec756763b',
        //   filePath: './docs/markdown.md',
        //   fileName: 'markdown',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/markdown' },
        // { id: '7135cdf1062f91e',
        //   filePath: './getting-started/key-concepts.md',
        //   fileName: 'key-concepts',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/key-concepts' },
        // { id: '1abbe13654a8651',
        //   filePath: './getting-started/build-and-deploy.md',
        //   fileName: 'build-and-deploy',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/build-and-deploy' },
        // { id: 'getting-started',
        //   filePath: './getting-started/index.md',
        //   fileName: 'index',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/' },
        // { id: 'd13f3b1a48b11ac',
        //   filePath: './getting-started/project-setup.md',
        //   fileName: 'project-setup',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/project-setup' },
        // { id: 'e80510568562ced',
        //   filePath: './getting-started/next-steps.md',
        //   fileName: 'next-steps',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/next-steps' },
        // { id: 'cf130a69289425d',
        //   filePath: './getting-started/quick-start.md',
        //   fileName: 'quick-start',
        //   template: 'page',
        //   title: 'Getting Started',
        //   link: '/getting-started/quick-start' },
        // { id: '9d2b98c69ab0867',
        //   filePath: './plugins/webpack.md',
        //   fileName: 'webpack',
        //   template: 'page',
        //   title: 'Plugins',
        //   link: '/plugins/webpack' },
        // { id: '8b231661fded283',
        //   filePath: './plugins/composite-plugins.md',
        //   fileName: 'composite-plugins',
        //   template: 'page',
        //   title: 'Plugins',
        //   link: '/plugins/composite-plugins' },
        // { id: '272e40c3703d4f2',
        //   filePath: './plugins/index-hooks.md',
        //   fileName: 'index-hooks',
        //   template: 'page',
        //   title: 'Plugins',
        //   link: '/plugins/index-hooks' },
        // { id: '5082835f0f7f7d7',
        //   filePath: './docs/data.md',
        //   fileName: 'data',
        //   template: 'page',
        //   title: 'Docs',
        //   link: '/docs/data' },
        // { id: 'dd1ec2ef00cc386',
        //   filePath: './plugins/index.md',
        //   fileName: 'index',
        //   template: 'page',
        //   title: 'Plugins',
        //   link: '/plugins/' } ]
      });

      describe('getNavigationFromGraph', function() {
        let navigation = [];

        before(async function() {
          navigation = await graphResolvers.Query.navigation(undefined, {}, GRAPH_MOCK);
        });

        it('should have 4 children', function() {
          expect(navigation.length).to.equal(4);
        });

        it('should have About as the first item', function() {
          const item = navigation[0];

          expect(item.label).to.be.equal('About');
          expect(item.link).to.be.equal('/about/');
        });

        it('should have Docs as the second item', function() {
          const item = navigation[1];

          expect(item.label).to.be.equal('Docs');
          expect(item.link).to.be.equal('/docs/');
        });

        it('should have Getting Started as the third item', function() {
          const item = navigation[2];

          expect(item.label).to.be.equal('Getting Started');
          expect(item.link).to.be.equal('/getting-started/');
        });

        it('should have Plugins as the fourth item', function() {
          const item = navigation[3];

          expect(item.label).to.be.equal('Plugins');
          expect(item.link).to.be.equal('/plugins/');
        });
      });

      describe('getChildrenFromParentRoute for (mock) Getting Started', function() {
        let children = [];

        before(async function() {
          children = await graphResolvers.Query.children(undefined, { parent: 'getting-started' }, GRAPH_MOCK);
        });

        it('should have 8 children', function() {
          expect(children.length).to.equal(8);
        });

        it('should have the expected value for id for each child', function() {
          expect(children[0].id).to.equal('5436f1acd7a0297');
          expect(children[1].id).to.equal('878f45b3dea2a2e');
          expect(children[2].id).to.equal('7135cdf1062f91e');
          expect(children[3].id).to.equal('1abbe13654a8651');
          expect(children[4].id).to.equal('getting-started'); // TODO not a hash!
          expect(children[5].id).to.equal('d13f3b1a48b11ac');
          expect(children[6].id).to.equal('e80510568562ced');
          expect(children[7].id).to.equal('cf130a69289425d');
        });

        it('should have the expected filePath for each child', function() {
          children.forEach(function(child) {
            const path = child.fileName === 'index' ? '' : child.fileName;

            expect(child.link).to.equal(`/getting-started/${path}`);
          });
        });

        it('should have the expected fileName for each child', function() {
          expect(children[0].fileName).to.equal('branding');
          expect(children[1].fileName).to.equal('creating-content');
          expect(children[2].fileName).to.equal('key-concepts');
          expect(children[3].fileName).to.equal('build-and-deploy');
          expect(children[4].fileName).to.equal('index');
          expect(children[5].fileName).to.equal('project-setup');
          expect(children[6].fileName).to.equal('next-steps');
          expect(children[7].fileName).to.equal('quick-start');
        });

        it('should have the expected link for each child', function() {
          children.forEach(function(child) {
            expect(child.filePath).to.equal(`./getting-started/${child.fileName}.md`);
          });
        });

        it('should have "page" as the template for all children', function() {
          children.forEach(function(child) {
            expect(child.template).to.equal('page');
          });
        });

        it('should have "Getting Started" as the title for all children', function() {
          children.forEach(function(child) {
            expect(child.title).to.equal('Getting Started');
          });
        });
      });
    });

  });
});