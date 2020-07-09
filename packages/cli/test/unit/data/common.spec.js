const expect = require('chai').expect;
const { gql } = require('apollo-server');
const { getQueryHash } = require('../../../src/data/common');

describe('Unit Test: Data', function() {

  describe('Common', function() {

    describe('getQueryHash', function() {
      
      describe('standard graph query', function () {
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

        expect(hash).to.be.equal('graphidtitlelinkfilePathfileNametemplate');
      });

      describe('custom graph query and custom data', function () {
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

        expect(hash).to.be.equal('graphtitlelinkdatadateimage');
      });

      describe('query with variables', function () {
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

        expect(hash).to.be.equal('childrenidtitlelinkfilePathfileNametemplate_docs');
      });
    });

  });
});