/*
 * Use Case
 * Run Greenwood with the sitemap adapter plugin.
 *
 * User Result
 * Should generate a static Greenwood build with a sitemap rendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterSitemap } from '../../../src/index.js';
* 
* export default {
*   plugins: [
*     greenwoodPluginAdapterSitemap()
*   ]
* };
 *
 * User Workspace
 * TBD
 */
import chai from 'chai';
import fs from 'fs/promises';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { checkResourceExists } from '../../../../cli/src/lib/resource-utils.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { normalizePathnameForWindows } from '../../../../cli/src/lib/resource-utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Sitemap Adapter plugin output';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const publicDir = path.join(outputPath, 'public')
  
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

    describe('sitemap.xml', function() {
      it('should be present', async function() {
        const sitemapPath = path.join(publicDir, 'sitemap.xml')

        const itExists = await checkResourceExists(new URL(`file://${sitemapPath}`));
        expect(itExists).to.be.equal(true);

      });

      it('should have the correct first element in the list', async function() {
        const sitemapPath = path.join(publicDir, 'sitemap.xml');
        const text = await fs.readFile(sitemapPath, 'utf8');
    
        
        const regex = /<loc>(http:\/\/www\.example\.com\/about\/)<\/loc>/;
        const match = text.match(regex);

        expect(match[1]).to.equal('http://www.example.com/about/');
      });

      
    });

  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });

});