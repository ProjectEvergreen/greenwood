import chai from "chai";
import { graphResolvers } from "../../../src/schema/graph.js";
import { MOCK_GRAPH } from "../mocks/graph.js";

const expect = chai.expect;

xdescribe("Unit Test: Data", function () {
  describe("Schema", function () {
    describe("Graph", function () {
      describe("getChildrenFromGraph", function () {
        describe("with default sort", function () {
          let data = [];

          before(async function () {
            data = await graphResolvers.Query.children(
              undefined,
              {
                parent: "/getting-started",
              },
              {
                graph: MOCK_GRAPH.graph,
                config: {
                  basePath: "/my-app",
                },
              },
            );
          });

          it("should have 7 children", function () {
            expect(data.length).to.equal(7);
          });

          it("should have Branding as the first item", function () {
            const item = data[0];

            expect(item.label).to.be.equal("Branding");
            expect(item.route).to.be.equal("/getting-started/branding");
          });

          it("should have Build and Deploy as the second item", function () {
            const item = data[1];

            expect(item.label).to.be.equal("Build And Deploy");
            expect(item.route).to.be.equal("/getting-started/build-and-deploy");
          });

          it("should have Creating Content as the third item", function () {
            const item = data[2];

            expect(item.label).to.be.equal("Creating Content");
            expect(item.route).to.be.equal("/getting-started/creating-content");
          });

          it("should have Key Concepts as the fourth item", function () {
            const item = data[3];

            expect(item.label).to.be.equal("Key Concepts");
            expect(item.route).to.be.equal("/getting-started/key-concepts");
          });

          it("should have Next Steps as the fifth item", function () {
            const item = data[4];

            expect(item.label).to.be.equal("Next Steps");
            expect(item.route).to.be.equal("/getting-started/next-steps");
          });

          it("should have Project Setup as the sixth item", function () {
            const item = data[5];

            expect(item.label).to.be.equal("Project Setup");
            expect(item.route).to.be.equal("/getting-started/project-setup");
          });

          it("should have Quick Start as the seventh item", function () {
            const item = data[6];

            expect(item.label).to.be.equal("Quick Start");
            expect(item.route).to.be.equal("/getting-started/quick-start");
          });
        });
      });
    });
  });
});
