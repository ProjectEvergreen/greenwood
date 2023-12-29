import chai from 'chai';
import { getQueryHash } from '../../src/core/common.js';

const expect = chai.expect;

describe('Unit Test: Data', function() {

  describe('Common', function() {

    describe('getQueryHash', function() {

      it('should return the expected hash for a standard graph query', function () {
        // __typename is added by server.js
        const query = `
          query {
            graph {
              id,
              title,
              route,
              path,
              filename,
              layout,
              __typename
            }
          }
        `;
        const hash = getQueryHash(query);

        expect(hash).to.be.equal('1291879437');
      });

      it('should return the expected hash for a custom graph query with custom data', function () {
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

        expect(hash).to.be.equal('1136154652');
      });

      it('should return the expected hash for a children query with a variable', function () {
        const query = `
          query($parent: String!) {
            children(parent: $parent) {
              id,
              title,
              route,
              path,
              filename,
              layout
            }
          }
        `;
        const hash = getQueryHash(query, {
          parent: '/docs/'
        });

        expect(hash).to.be.equal('2106154137');
      });
    });

  });
});