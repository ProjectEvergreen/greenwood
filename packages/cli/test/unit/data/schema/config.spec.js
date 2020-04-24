const expect = require('chai').expect;
const MOCK_CONFIG = require('../mocks/config');
const { configResolvers } = require('../../../../src/data/schema/config');

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
  
        it('should have the expected devServer.host', function() {  
          expect(config.devServer.host).to.equal(devServer.host);
        });
      });

      describe('Meta', function() {
        const { meta } = MOCK_CONFIG.config;

        it('should have the expected name meta in the first indexx', function() {
          const nameMeta = config.meta[0];

          expect(nameMeta.name).to.equal(meta[0].name);
        });
  
        it('should have the expected devServer.host', function() {  
          const nameMeta = config.meta[0];

          expect(nameMeta.content).to.equal(meta[0].content);
        });

        it('should have the expected rel meta in the second index', function() {
          const relMeta = config.meta[1];

          expect(relMeta.rel).to.equal(meta[1].rel);
        });
  
        it('should have the expected devServer.host', function() {  
          const relMeta = config.meta[1];

          expect(relMeta.content).to.equal(meta[1].content);
        });
      });

      describe('Public Path', function() {
        const { publicPath } = MOCK_CONFIG.config;

        it('should have the expected publicPath', function() {  
          expect(publicPath).to.equal(config.publicPath);
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