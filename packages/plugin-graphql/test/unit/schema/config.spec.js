const expect = require('chai').expect;
const MOCK_CONFIG = require('../mocks/config');
const { configResolvers } = require('../../../src/schema/config');

describe('Unit Test: Data', function() {

  describe('Schema', function() {

    describe('Config', function() {
      let config = {};

      before(async function() {
        config = await configResolvers.Query.config(undefined, {}, MOCK_CONFIG);
      });

      describe('Dev Server', function() {
        const { devServer } = MOCK_CONFIG.config;

        it('should have the expected devServer.port', function() {
          expect(config.devServer.port).to.equal(devServer.port);
        });
      });

      describe('Meta', function() {
        const { meta } = MOCK_CONFIG.config;

        it('should have the expected name meta in the first indexx', function() {
          const nameMeta = config.meta[0];

          expect(nameMeta.name).to.equal(meta[0].name);
        });

        it('should have the expected rel meta in the second index', function() {
          const relMeta = config.meta[1];

          expect(relMeta.rel).to.equal(meta[1].rel);
        });
      });

      describe('Mode', function() {

        it('should have a default optimization setting of spa', function() {
          expect(config.optimization).to.equal(MOCK_CONFIG.config.optimization);
        });

      });

      describe('Title', function() {
        const { title } = MOCK_CONFIG.config;

        it('should have the expected title', function() {  
          expect(title).to.equal(config.title);
        });
      });

      describe('Workspace', function() {
        const { workspace } = MOCK_CONFIG.config;

        it('should have the expected title', function() {  
          expect(workspace).to.equal(config.workspace);
        });
      });

    });

  });
});