
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

import chai from 'chai';
const expect = chai.expect;

describe('Develop Sitemap With: ', function() {

  const LABEL = 'Sitemap Resource plugin output';

  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Sitemap.xml', function() {
      let response = {};
      let text;

      before(async function() {
        response = await fetch(`${hostname}:${port}/sitemap.xml`);
        text = await response.text();
      });

      it('should return a 200', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/xml');
      });

      it('should contain loc element', function() {
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