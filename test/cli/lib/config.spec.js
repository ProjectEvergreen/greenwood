const expect = require('chai').expect;
const initConfig = require('../../../packages/cli/lib/config');

let defaultConfig = {
  workspace: '/Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/src',
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  publicPath: '/'
};

// TODO: from config file, or leave for cases?
describe('Config Lib (Injected', () => {

  describe('Default Configuration', () => {
    let config;

    before(async () => {
      config = await initConfig();
    });

    it('should have default value for workspace', () => {
      expect(config.workspace).to.equal(defaultConfig.workspace);
    });

    it('should have default value for devServer', () => {
      expect(config.devServer).to.exist;
      expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
      expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
    });

    it('should have default value for publicPath', () => {
      expect(config.publicPath).to.equal(defaultConfig.publicPath);
    });

    describe('Error Handling', () => {     
      it('should return default configuration when an empty object is passed', async () => {
        const config = await initConfig({});

        expect(config.workspace).to.equal(defaultConfig.workspace);
        expect(config.devServer).to.exist;
        expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
        expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
        expect(config.publicPath).to.equal(defaultConfig.publicPath);
      });
  
      xit('should return default configuration when garbage input is provided', async () => {
        const config = await initConfig({
          name: 'joe',
          age: 12
        });

        expect(config.workspace).to.equal(defaultConfig.workspace);
        expect(config.devServer).to.exist;
        expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
        expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
        expect(config.publicPath).to.equal(defaultConfig.publicPath);
      });
    });
  });

  describe('Custom Configuration: Dev Server', () => {
    const customConfig = {
      devServer: {
        port: 1234,
        host: 'http://projectevergreen.github.io'
      }
    };

    before(async () => {
      config = await readAndMergeConfig(customConfig);
    });

    it('should return custom value for devServer.port', () => {
      expect(config.devServer.port).to.equal(customConfig.devServer.port);
    });

    it('should return custom value for devServer.host', () => {
      expect(config.devServer.host).to.equal(customConfig.devServer.host);
    });

    // TODO error handling
    xdescribe('Error Handling', () => {
      it('should return an error when an invalid value for devServer.port', () => {
        // config = await readAndMergeConfig({
        //   devServer: {
        //     port: 'abc'
        //   }
        // });

        expect(async () => await readAndMergeConfig({
          devServer: {
            port: 'abc'
          }
        })).to.throw(new Error('abc')); 
        // 'Error: the string "Error: greenwood.config.js devServer port must be an integer" was thrown, throw an Error :)');
        // expect(model.get.bind(model, 'z')).to.throw('Property does not exist in model schema.');
        // expect(model.get.bind(model, 'z')).to.throw(new Error('Property does not exist in model schema.'))
      });
  
      it('should return an error when an invalid value for devServer.port', () => {
  
      });
    });

  });

  xdescribe('Custom Configuration: Public Path', () => {
    before(async () => {
      config = readAndMergeConfig();
    });

    it('should have default value for workspace', () => {

    });

    it('should have default value for devServer', () => {

    });

    it('should have default value for publicPath', () => {

    });
  });

  xdescribe('Custom Configuration: Workspace Path', () => {
    before(async () => {
      config = readAndMergeConfig();
    });

    it('should have default value for workspace', () => {

    });

    it('should have default value for devServer', () => {

    });

    it('should have default value for publicPath', () => {

    });
  });

});