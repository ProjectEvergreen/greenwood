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
const GRAPH_MOCK = require('./mocks/graph');
const { graphResolvers } = require('../../../src/data/schema/graph');

describe('Unit Test: Data - Schema', function() {

  describe('Schema: Graph', function() {

    xdescribe('getPagesFromGraph', function() {

    });

    xdescribe('getNavigationFromGraph', function() {

    });

    describe('getChildrenFromParentRoute for mock Getting Started', function() {
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