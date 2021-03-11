const expect = require('chai').expect;
const MOCK_GRAPH = require('../mocks/graph');
const { graphResolvers } = require('../../../src/schema/graph');

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
            expect(page.path).to.exist;
            expect(page.filename).to.exist;
            expect(page.template).to.exist;
            expect(page.title).to.exist;
            expect(page.route).to.exist;
          });
        });
      });

      describe('getChildrenFromParentRoute for (mock) Getting Started', function() {
        let children = [];

        before(async function() {
          children = await graphResolvers.Query.children(undefined, { parent: 'getting-started' }, MOCK_GRAPH);
        });

        it('should have 8 children', function() {
          // console.debug(children);
          expect(children.length).to.equal(7);
        });

        it('should have the expected value for id for each child', function() {
          expect(children[0].id).to.equal('branding');
          expect(children[1].id).to.equal('build-and-deploy');
          expect(children[2].id).to.equal('creating-content');
          expect(children[3].id).to.equal('key-concepts');
          expect(children[4].id).to.equal('next-steps');
          expect(children[5].id).to.equal('project-setup');
          expect(children[6].id).to.equal('quick-start');
        });

        it('should have the expected path for each child', function() {
          children.forEach(function(child) {
            expect(child.route).to.equal(`/getting-started/${child.label}`);
          });
        });

        it('should have the expected label for each child', function() {
          expect(children[0].label).to.equal('branding');
          expect(children[1].label).to.equal('build-and-deploy');
          expect(children[2].label).to.equal('creating-content');
          expect(children[3].label).to.equal('key-concepts');
          expect(children[4].label).to.equal('next-steps');
          expect(children[5].label).to.equal('project-setup');
          expect(children[6].label).to.equal('quick-start');
        });

        it('should have the expected path for each child', function() {
          children.forEach(function(child) {
            expect(child.path).to.contain(`/getting-started/${child.label}.md`);
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