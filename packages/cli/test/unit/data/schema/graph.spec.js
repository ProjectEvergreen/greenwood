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

      describe('getMenuFromGraph', function() {
        let navigation = [];

        before(async function() {
          navigation = await graphResolvers.Query.menu(undefined, { pathname: '/', filter: 'navigation' }, MOCK_GRAPH);
        });

        it('should have 4 children', function() {
          expect(navigation.children.length).to.equal(4);
        });

        it('should have About as the first item', function() {
          const item = navigation.children[0].item;

          expect(item.label).to.be.equal('About');
          expect(item.link).to.be.equal('/about/');
        });

        it('should have Docs as the second item', function() {
          const item = navigation.children[1].item;

          expect(item.label).to.be.equal('Docs');
          expect(item.link).to.be.equal('/docs/');
        });

        it('should have Getting Started as the third item', function() {
          const item = navigation.children[2].item;

          expect(item.label).to.be.equal('Getting Started');
          expect(item.link).to.be.equal('/getting-started/');
        });

        it('should have Plugins as the fourth item', function() {
          const item = navigation.children[3].item;

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
          expect(children[0].id).to.equal('css-components');
          expect(children[1].id).to.equal('deploy');
          expect(children[2].id).to.equal('create-content');
          expect(children[3].id).to.equal('getting-started');
          expect(children[4].id).to.equal('concepts');
          expect(children[5].id).to.equal('next');
          expect(children[6].id).to.equal('project-setup');
          expect(children[7].id).to.equal('start');
        });

        it('should have the expected filePath for each child', function() {
          children.forEach(function(child) {
            const path = child.fileName === 'index' ? '' : child.fileName;

            expect(child.link).to.equal(`/getting-started/${path}`);
          });
        });

        it('should have the expected fileName for each child', function() {
          expect(children[0].fileName).to.equal('branding');
          expect(children[1].fileName).to.equal('build-and-deploy');
          expect(children[2].fileName).to.equal('creating-content');
          expect(children[3].fileName).to.equal('index');
          expect(children[4].fileName).to.equal('key-concepts');
          expect(children[5].fileName).to.equal('next-steps');
          expect(children[6].fileName).to.equal('project-setup');
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

        it('should have the expected title for each child', function() {
          expect(children[0].title).to.equal('Styles and Web Components');
          expect(children[1].title).to.equal('Build and Deploy');
          expect(children[2].title).to.equal('Creating Content');
          expect(children[3].title).to.equal('Getting Started');
          expect(children[4].title).to.equal('Key Concepts');
          expect(children[5].title).to.equal('Next Steps');
          expect(children[6].title).to.equal('Project Setup');
          expect(children[7].title).to.equal('Quick Start');
        });
      });
    });

  });
});