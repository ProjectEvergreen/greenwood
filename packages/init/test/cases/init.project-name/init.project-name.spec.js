/*
 * Use Case
 * Scaffold into a custom project directory
 *
 * User Result
 * Should scaffold out the new project into a my-app directory.
 *
 * User Command
 * npx @greenwood/init my-app
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

describe('Scaffold Greenwood into a custom directory: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const projectName = 'my-app';
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(`Default output to a custom ${projectName} directory`, function () {

    before(function() {
      runner.setup(outputPath);
      runner.runCommand(initPath, `${projectName} --foo=bar`);
    });

    describe('expected scaffolding output', function () {

      it('should create a src/pages directory', function() {
        expect(fs.existsSync(path.join(outputPath, projectName, 'src', 'pages'))).to.be.true;
      });

      it('should generate a .gitignore file', function() {
        expect(fs.existsSync(path.join(outputPath, projectName, '.gitignore'))).to.be.true;
      });

      it('should generate a package.json file', function() {
        expect(fs.existsSync(path.join(outputPath, projectName, 'package.json'))).to.be.true;
      });

      it('should have the name in package.json match the project name argument', function() {
        const packageJson = JSON.parse(fs.readFileSync(path.join(outputPath, projectName, 'package.json'), 'utf-8'));

        expect(packageJson.name).to.equal(projectName);
      });
    });

  });

  after(function() {
    runner.teardown([outputPath]);
  });

});