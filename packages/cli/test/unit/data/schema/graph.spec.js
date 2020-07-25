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

        it('should have 28 pages', function() {
          expect(pages.length).to.equal(28);
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

      describe('getChildrenFromParentRoute for (mock) Getting Started', function() {
        let children = [];

        before(async function() {
          children = await graphResolvers.Query.children(undefined, { parent: 'getting-started' }, MOCK_GRAPH);
        });

        it('should have 8 children', function() {
          expect(children.length).to.equal(7);
        });

        it('should have the expected value for id for each child', function() {
          expect(children[0].id).to.equal('css-components');
          expect(children[1].id).to.equal('deploy');
          expect(children[2].id).to.equal('create-content');
          expect(children[3].id).to.equal('concepts');
          expect(children[4].id).to.equal('next');
          expect(children[5].id).to.equal('project-setup');
          expect(children[6].id).to.equal('start');
        });

        it('should have the expected filePath for each child', function() {
          children.forEach(function(child) {
            expect(child.link).to.equal(`/getting-started/${child.fileName}`);
          });
        });

        it('should have the expected fileName for each child', function() {
          expect(children[0].fileName).to.equal('branding');
          expect(children[1].fileName).to.equal('build-and-deploy');
          expect(children[2].fileName).to.equal('creating-content');
          expect(children[3].fileName).to.equal('key-concepts');
          expect(children[4].fileName).to.equal('next-steps');
          expect(children[5].fileName).to.equal('project-setup');
          expect(children[6].fileName).to.equal('quick-start');
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
          expect(children[3].title).to.equal('Key Concepts');
          expect(children[4].title).to.equal('Next Steps');
          expect(children[5].title).to.equal('Project Setup');
          expect(children[6].title).to.equal('Quick Start');
        });

        it('should have expected custom front matter data if it is set', function() {
          expect(children[0].data.menu).to.equal('side');
        });
      });
    });

  });
});