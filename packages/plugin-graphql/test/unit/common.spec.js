import chai from "chai";
import { getQueryHash } from "../../src/core/common.js";
import { HASH_REGEX } from "@greenwood/cli/src/lib/hashing-utils.js";

const expect = chai.expect;

describe("Unit Test: Data", function () {
  describe("Common", function () {
    describe("getQueryHash", function () {
      it("should return the expected hash for a standard graph query", function () {
        // __typename is added by server.js
        const query = `
          query {
            graph {
              title,
              route,
              path,
              layout,
              __typename
            }
          }
        `;
        const hash = getQueryHash(query);

        expect(hash).to.match(new RegExp(HASH_REGEX));
      });

      it("should return the expected hash for a custom graph query with custom data", function () {
        const query = `
          query {
            graph {
              title,
              route,
              data {
                date,
                image
              }
            }
          }
        `;
        const hash = getQueryHash(query);

        expect(hash).to.match(new RegExp(HASH_REGEX));
      });

      it("should return the expected hash for a children query with a variable", function () {
        const query = `
          query($parent: String!) {
            children(parent: $parent) {
              title,
              route,
              path,
              layout
            }
          }
        `;
        const hash = getQueryHash(query, {
          parent: "/docs/",
        });

        expect(hash).to.match(new RegExp(HASH_REGEX));
      });
    });
  });
});
