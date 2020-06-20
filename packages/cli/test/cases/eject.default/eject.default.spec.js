/*
 * Use Case
 * Run Greenwood eject command to copy core configuration files
 *
 * User Result
 * Should eject configuration files to working directory
 *
 * User Command
 * greenwood eject
 */
const fs = require('fs-extra');
const path = require('path');
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

describe('Eject Greenwood With: ', function() {
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe('Default Eject Option', function() {

    before(async function() {
      await setup.runGreenwoodCommand('eject');
    });

    it('should output webpack config files to project working directory', function() {
      let configFiles = fs.readdirSync(__dirname);
      
      configFiles = configFiles.filter((file) => file !== 'node_modules' && file !== 'eject.default.spec.js');
      
      /* 
      * 'webpack.config.common.js',
      * 'webpack.config.develop.js',
      * 'webpack.config.prod.js'
      */
      expect(configFiles.length).to.equal(3);
    });

    after(function() {
      // remove files
      const configFiles = fs.readdirSync(__dirname);

      configFiles.forEach(file => {
        if (file !== 'eject.default.spec.js') {
          fs.remove(path.join(__dirname, file));
        }
      });
    });
  });

  describe('Eject All Option', function() {

    before(async function() {
      await setup.runGreenwoodCommand('eject --all');
    });

    it('should output webpack, postcss, babel, browserlistrc config files to working directory', function() {
      let configFiles = fs.readdirSync(__dirname);

      configFiles = configFiles.filter((file) => file !== 'node_modules' && file !== 'eject.default.spec.js');

      /* 
      * '.browserslistrc',
      * 'babel.config.js',
      * 'postcss.config.js',
      * 'webpack.config.common.js',
      * 'webpack.config.develop.js',
      * 'webpack.config.prod.js'
      */
      expect(configFiles.length).to.equal(6);
    });

    after(function() {
      // remove files
      const configFiles = fs.readdirSync(__dirname);

      configFiles.forEach(file => {
        if (file !== 'eject.default.spec.js') {
          fs.remove(path.join(__dirname, file));
        }
      });
    });
  });
});