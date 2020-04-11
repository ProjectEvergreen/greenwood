const expect = require('chai').expect;
const MOCK_GRAPH = require('../mocks/graph');
const { graphResolvers } = require('../../../../src/data/schema/graph');

describe('Unit Test: Data', function() {

  describe('Schema', function() {

    describe('Graph', function() {

      describe('getPagesFromGraph', function() {
        let pages = [];

        before(async function() {
          pages = await graphResolvers.Query.graph(undefined, {}, MOCK_GRAPH);
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
      });

      describe('getNavigationFromGraph', function() {
        let navigation = [];

        before(async function() {
          navigation = await graphResolvers.Query.navigation(undefined, {}, MOCK_GRAPH);
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
          children = await graphResolvers.Query.children(undefined, { parent: 'getting-started' }, MOCK_GRAPH);
        });

        it('should have 8 children', function() {
          expect(children.length).to.equal(8);
        });

        it('should have the expected value for id for each child', function() {
          expect(children[0].id).to.equal('5436f1acd7a0297');
          expect(children[1].id).to.equal('878f45b3dea2a2e');
          expect(children[2].id).to.equal('7135cdf1062f91e');
          expect(children[3].id).to.equal('1abbe13654a8651');
          expect(children[4].id).to.equal('0f09ddfde58fbc3');
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

        it('should have expected custom front matter data if it is set', function() {
          children.forEach(function(child, index) {
            expect(child.data.foo).to.equal(`bar${index + 1}`);
          });
        });
      });
    });

  });
});