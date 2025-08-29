import chai from "chai";
import { graphResolvers } from "../../../src/schema/graph.js";
import { MOCK_GRAPH } from "../mocks/graph.js";

const expect = chai.expect;

xdescribe("Unit Test: Data", function () {
  describe("Schema", function () {
    describe("Graph", function () {
      describe("getPagesFromGraph", function () {
        let pages = [];

        before(async function () {
          pages = await graphResolvers.Query.graph(undefined, {}, MOCK_GRAPH);
        });

        it("should have 28 pages", function () {
          expect(pages.length).to.equal(28);
        });

        it("should have all expected properties for each page", function () {
          pages.forEach(function (page) {
            expect(page.label).to.exist;
            expect(page.layout).to.exist;
            expect(page.title).to.exist;
            expect(page.route).to.exist;
          });
        });
      });

      describe("getChildrenFromParentRoute for (mock) Getting Started", function () {
        let children = [];

        before(async function () {
          children = await graphResolvers.Query.children(
            undefined,
            { parent: "/getting-started" },
            {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: "",
              },
            },
          );
        });

        it("should have 7 children", function () {
          expect(children.length).to.equal(7);
        });

        it("should have the expected route for each child", function () {
          expect(children[0].route).to.equal("/getting-started/branding");
          expect(children[1].route).to.equal("/getting-started/build-and-deploy");
          expect(children[2].route).to.equal("/getting-started/creating-content");
          expect(children[3].route).to.equal("/getting-started/key-concepts");
          expect(children[4].route).to.equal("/getting-started/next-steps");
          expect(children[5].route).to.equal("/getting-started/project-setup");
          expect(children[6].route).to.equal("/getting-started/quick-start");
        });

        it("should have the expected label for each child", function () {
          expect(children[0].label).to.equal("Branding");
          expect(children[1].label).to.equal("Build And Deploy");
          expect(children[2].label).to.equal("Creating Content");
          expect(children[3].label).to.equal("Key Concepts");
          expect(children[4].label).to.equal("Next Steps");
          expect(children[5].label).to.equal("Project Setup");
          expect(children[6].label).to.equal("Quick Start");
        });

        it('should have "page" as the layout for all children', function () {
          children.forEach(function (child) {
            expect(child.layout).to.equal("page");
          });
        });

        it("should have the expected title for each child", function () {
          expect(children[0].title).to.equal("Styles and Web Components");
          expect(children[1].title).to.equal("Build and Deploy");
          expect(children[2].title).to.equal("Creating Content");
          expect(children[3].title).to.equal("Key Concepts");
          expect(children[4].title).to.equal("Next Steps");
          expect(children[5].title).to.equal("Project Setup");
          expect(children[6].title).to.equal("Quick Start");
        });

        it("should have expected custom front matter data if it is set", function () {
          expect(children[0].data.collection).to.equal("side");
        });
      });
    });
  });
});
