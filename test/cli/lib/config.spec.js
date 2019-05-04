const expect = require('chai').expect;
const path = require('path');
const initConfig = require('../../../packages/cli/lib/config');

let defaultConfig = {
  workspace: '/Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/src',
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  publicPath: '/'
};

xdescribe('Config Lib (Injected)', () => {

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
        config = await initConfig({});

        expect(config.workspace).to.equal(defaultConfig.workspace);
        expect(config.devServer).to.exist;
        expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
        expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
        expect(config.publicPath).to.equal(defaultConfig.publicPath);
      });
  
      it('should return default configuration when garbage input is provided', async () => {
        config = await initConfig({
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

    after(async () => {
      config = {};
    });
  });

  describe('Custom Configuration: Dev Server', () => {
    let config;
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
    // 'Error: the string "Error: greenwood.config.js devServer port must be an integer" was thrown, throw an Error :)');
    // expect(model.get.bind(model, 'z')).to.throw('Property does not exist in model schema.');
    // expect(model.get.bind(model, 'z')).to.throw(new Error('Property does not exist in model schema.'))
    xdescribe('Error Handling', () => {
      it('should return an error when an invalid value for devServer.port', () => {
        expect(async () => await readAndMergeConfig({
          devServer: {
            port: 'abc'
          }
        })).to.throw(new Error('abc')); 
      });
  
      it('should return an error when an invalid value for devServer.port', () => {
  
      });
    });

    after(async () => {
      config = {};
    });

  });

  describe('Custom Configuration: Public Path', () => {
    let config;
    const customConfig = {
      publicPath: '/eve'
    };

    before(async () => {
      config = await readAndMergeConfig(customConfig);
    });

    it('should have the expected value for publicPath', () => {
      expect(config.publicPath).to.exist;
      expect(config.publicPath).to.equal(customConfig.publicPath);
    });

    // TODO error handling
    xdescribe('Error Handling', () => {
      it('should return an error when a string is not provider', () => {
        expect(async () => await readAndMergeConfig({
          publicPath: 2
        })).to.throw(new Error('abc')); 
      });
    });

    after(async () => {
      config = {};
    });
  });

  describe('Custom Configuration: Workspace Path', () => {
    before(async () => {
      config = await readAndMergeConfig({
        workspace: path.join(__dirname, '.')
      });
    });

    it('should return the path provided as publicPath (if it is absolute)', () => {
      expect(config.workspace).to.equal(defaultConfig.workspace);
    });

    // TODO error handling
    xdescribe('Error Handling', () => {
      it('should return an error when a string is not provided', () => {
        expect(async () => await readAndMergeConfig({
          publicPath: 2
        })).to.throw(new Error('abc')); 
      });
      
      it('should return an error when the directory doesnt exist', () => {
        expect(async () => await readAndMergeConfig({
          publicPath: 2
        })).to.throw(new Error('abc')); 
      });
    });

    after(async () => {
      config = {};
    });
  });

});