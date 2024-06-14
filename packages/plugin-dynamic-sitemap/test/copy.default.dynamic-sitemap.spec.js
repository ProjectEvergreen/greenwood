/*
 * Use Case
 * Run Greenwood build command with no config and this plugin.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly built sitemap.xml
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginDynamicExport } from '@greenwood/plugin-dynamic-sitemap';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginDynamicExport({
 *       "base_url": "https://example.com"
 *     })
 *  }]
 *
 * }
 *
 * User Workspace
*   src/
*     templates/
*        artist.html
*     pages/
*        index.md
*        about.md
*/

import fs from 'fs';
import chai from 'chai';
import path from 'path';
import { runSmokeTest } from '../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With Dynamic Sitemap Plugin: ', function() {
  const LABEL = 'Using Dynamic Sitemap feature';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Sitemap.xml should exist and be well formed', function() {
      let robots;

      
      it('should have one sitemaps file in the output directory', function() {
        const sitemapXML = fs.readFileSync(path.join(this.context.publicDir, './sitemap.xml'));
        console.log(sitemapXML);
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});