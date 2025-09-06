import chai from "chai";
import { graphResolvers } from "../../../src/schema/graph.js";
import { MOCK_GRAPH } from "../mocks/graph.js";

const expect = chai.expect;

xdescribe("Unit Test: Data", function () {
  describe("Schema", function () {
    describe("Graph", function () {
      describe("getCollection navigation menu", function () {
        describe("with default sort", function () {
          let collection = [];

          before(async function () {
            collection = await graphResolvers.Query.collection(
              undefined,
              {
                name: "navigation",
              },
              {
                graph: MOCK_GRAPH.graph,
                config: {
                  basePath: "",
                },
              },
            );
          });

          it("should have 4 children", function () {
            expect(collection.length).to.equal(4);
          });

          it("should have About as the first item", function () {
            const item = collection[0];

            expect(item.label).to.be.equal("About");
            expect(item.route).to.be.equal("/about/");
          });

          it("should have Docs as the second item", function () {
            const item = collection[1];

            expect(item.label).to.be.equal("Docs");
            expect(item.route).to.be.equal("/docs/");
          });

          it("should have Getting Started as the third item", function () {
            const item = collection[2];

            expect(item.label).to.be.equal("Getting Started");
            expect(item.route).to.be.equal("/getting-started/");
          });

          it("should have Plugins as the fourth item", function () {
            const item = collection[3];

            expect(item.label).to.be.equal("Plugins");
            expect(item.route).to.be.equal("/plugins/");
          });
        });
      });
    });
  });
});
