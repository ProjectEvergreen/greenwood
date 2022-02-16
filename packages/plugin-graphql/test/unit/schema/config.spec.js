import chai from 'chai';
import { configResolvers } from '../../../src/schema/config.js';
import { MOCK_CONFIG } from '../mocks/config.js';

const expect = chai.expect;

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

      describe('Optimization', function() {

        it('should have a default optimization setting of default', function() {
          expect(config.optimization).to.equal(MOCK_CONFIG.config.optimization);
        });

      });

      describe('Prerender', function() {

        it('should have a default prerender setting of false', function() {
          expect(config.optimization).to.equal(MOCK_CONFIG.config.prerender);
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