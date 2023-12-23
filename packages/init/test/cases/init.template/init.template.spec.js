/*
 * Use Case
 * Scaffold from minimal template using the --yarn flag.
 *
 * User Result
 * Should scaffold from the blog template.
 *
 * User Command
 * @greenwood/init --template=blog
 *
 * User Workspace
 * N / A
 */
import chai from 'chai';
import fs from 'fs';
import path from 'path';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Scaffold Greenwood From a (Blog) Template: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = fileURLToPath(new URL('./my-app', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('default blog template', function () {

    before(function() {
      runner.setup(outputPath);
      runner.runCommand(initPath, '--template=blog');
    });

    describe('expected file output', function () {

      it('should create a src/pages directory', function() {
        expect(fs.existsSync(path.join(outputPath, 'src', 'pages'))).to.be.true;
      });

      it('should generate a .gitignore file', function() {
        expect(fs.existsSync(path.join(outputPath, '.gitignore'))).to.be.true;
      });

      it('should generate a package.json file', function() {
        expect(fs.existsSync(path.join(outputPath, 'package.json'))).to.be.true;
      });
    });

  });

  after(function() {
    runner.teardown([outputPath]);
  });

});