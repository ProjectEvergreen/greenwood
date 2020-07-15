const expect = require('chai').expect;
const { gql } = require('apollo-server');
const { getQueryHash } = require('../../../src/data/common');

describe('Unit Test: Data', function() {

  describe('Common', function() {

    describe('getQueryHash', function() {
      
      it('should return the expected hash for a standard graph query', function () {
        // __typename is added by server.js
        const query = gql`
          query {
            graph {
              id,
              title,
              link,
              filePath,
              fileName,
              template,
              __typename
            }
          }
        `;
        const hash = getQueryHash(query);

        expect(hash).to.be.equal('876029931');
      });

      it('should return the expected hash for a custom graph query with custom data', function () {
        const query = gql`
          query {
            graph {
              title,
              link,
              data {
                date,
                image
              }
            }
          }
        `;
        const hash = getQueryHash(query);

        expect(hash).to.be.equal('1656784831');
      });

      it('should return the expected hash for a children query with a variable', function () {
        const query = gql`
          query($parent: String!) {
            children(parent: $parent) {
              id,
              title,
              link,
              filePath,
              fileName,
              template
            }
          }
        `;
        const hash = getQueryHash(query, {
          parent: '/docs/'
        });

        expect(hash).to.be.equal('1366211136');
      });
    });

  });
});