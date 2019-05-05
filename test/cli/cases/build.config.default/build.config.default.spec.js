/*
 * Use Case
 * Run Greenwood with empty config object and default workspace.
 * 
 * Uaer Result
 * TShould generate a bare bones Greenwood build.  (same as build.default.spec.js)
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {}
 * 
 * User Workspace
 * Greenwood default (src/)
 */
// const expect = require('chai').expect;
// const fs = require('fs');
// const glob = require('glob-promise');
// const { JSDOM } = require('jsdom');
// const path = require('path');
const TestBed = require('../../test-bed');
const runSmokeTest = require('../../smoke-test');

describe('Build Greenwood With: ', async () => {
  let setup;
  let context;

  before(async () => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });
  
  describe('Empty Configuration and Default Workspace', () => {
    before(async () => {     
      await setup.runGreenwoodCommand('build');
    });

    it('should pass the smoke test', async () => {
      await runSmokeTest(context, setup);
    });
  });

});