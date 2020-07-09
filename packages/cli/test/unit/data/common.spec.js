const expect = require('chai').expect;
const { gql } = require('apollo-server');
const { getQueryKeysHash } = require('../../../src/data/common');

describe('Unit Test: Data', function() {

  describe('Common', function() {

    describe('getQueryKeysHash', function() {
      
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
        const hash = getQueryKeysHash(query);

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
        const hash = getQueryKeysHash(query);

        expect(hash).to.be.equal('graphtitlelinkdatadateimage');
      });

      // TODO variables
      // describe('menu query (multiple nesting) with variables', async function () {
      //   const query = gql`
      //     query {
      //       graph {
      //         title,
      //         link,
      //         data {
      //           date,
      //           image
      //         }
      //       }
      //     }
      //   `;
      //   const hash = getQueryKeysHash(query);
      //   console.log('hash', hash);
      //   expect(hash).to.be.equal('graphtitlelinkdatadateimage');
      // });
    });

  });
});