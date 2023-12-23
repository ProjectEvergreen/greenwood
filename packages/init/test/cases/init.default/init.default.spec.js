/*
 * Use Case
 * Scaffold from minimal template with no flags.
 *
 * User Result
 * Should scaffold from template build.
 *
 * User Command
 * @greenwood/init
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

describe('Scaffold Greenwood With Default Template: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = fileURLToPath(new URL('./my-app', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: outputPath
    };
    runner = new Runner();
  });

  describe('default minimal output', function () {

    before(async function() {
      await fs.promises.mkdir(outputPath);
      runner.setup(outputPath);
      runner.runCommand(initPath);
    });

    describe('should scaffold project files and folders', () => {

      it('should create a src/pages directory', function() {
        expect(fs.existsSync(path.join(outputPath, 'src', 'pages'))).to.be.true;
      });

      it('should generate a .gitignore file', function() {
        expect(fs.existsSync(path.join(outputPath, '.gitignore'))).to.be.true;
      });

      it('should generate a package.json file', function() {
        expect(fs.existsSync(path.join(outputPath, 'package.json'))).to.be.true;
      });

      it('should not generate a package-lock.json file', function() {
        expect(fs.existsSync(path.join(outputPath, 'package-lock.json'))).to.be.false;
      });

      it('should not generate a yarn.lock file', function() {
        expect(fs.existsSync(path.join(outputPath, 'yarn.lock'))).to.be.false;
      });

      it('should not generate a public directory', function() {
        expect(fs.existsSync(path.join(outputPath, 'public'))).to.be.false;
      });
    });

    describe('initial package.json contents', function() {
      let pkgJson;

      before(async function() {
        pkgJson = JSON.parse(fs.readFileSync(path.join(outputPath, 'package.json'), 'utf-8'));
      });

      it('the should have the correct Greenwood scripts', function() {
        const scripts = pkgJson.scripts;

        expect(scripts.start).to.equal('greenwood develop');
        expect(scripts.build).to.equal('greenwood build');
        expect(scripts.serve).to.equal('greenwood serve');
      });

      it('the should have the correct Greenwood devDependency', function() {
        const scriptPkg = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../../package.json', import.meta.url)), 'utf-8'));

        expect(pkgJson.devDependencies['@greenwood/cli']).to.equal(`~${scriptPkg.version}`);
      });
    });

    describe('initial page contents', function() {
      it('should have the correct contents for src/pages.index.md', function() {
        const pageContents = fs.readFileSync(path.join(outputPath, 'src/pages/index.md'), 'utf-8');

        expect(pageContents).to.equal('## My Project');
      });
    });
  });

  after(function() {
    runner.teardown([outputPath]);
  });
});