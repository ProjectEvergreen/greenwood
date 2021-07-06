/*
 * Use Case
 * Run Greenwood with TypeScript processing merging user and default tsconfig.json options.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed based on their own tsconfig.json file merged with the plugin default config.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginTypeScript = require('@greenwod/plugin-typescript');
 *
 * {
 *   plugins: [
 *     ...pluginTypeScript({
 *        extendConfig: true
 *     })
 *   ]
 * }
 * 
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.ts
 * 
 * User tsconfig.json (example)
 * {
 *   "compilerOptions": {
 *     "expirementalDecorators": true,
 *     "strict": true
 *   }
 * };
 */
const fs = require('fs');
const glob = require('glob-promise');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom TypeScript Options for extending Default Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let jsFiles;

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      jsFiles = glob.sync(path.join(this.context.publicDir, '*.js'));
    });

    runSmokeTest(['public', 'index'], LABEL);    

    it('should output one JavaScript file', function() {
      expect(jsFiles.length).to.equal(1);
    });

    describe('TypeScript should process JavaScript that references decorators', function() {
      it('should output correctly processed JavaScript without decorators', function() {
        const notExpectedJavaScript = '@customElement(\'app-greeting\')';
        const javascript = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(javascript).to.not.contain(notExpectedJavaScript);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});