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

const expect = chai.expect;

describe('Scaffold Greenwood With Default Template: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = path.join(path.dirname(new URL('', import.meta.url).pathname), 'my-app');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'my-app')
    };
    runner = new Runner();
  });

  describe('default minimal output', function () {

    before(async function() {
      await fs.promises.mkdir(outputPath);
      await runner.setup(outputPath);
      await runner.runCommand(initPath);
    });

    describe('should scaffold project files and folders', () => {
      
      it('should create a src/pages directory', function() {
        expect(fs.existsSync(path.join(outputPath, 'src', 'pages'))).to.be.true;
      });

      it('should generate a greenwood.config.js file', function() {
        expect(fs.existsSync(path.join(outputPath, 'greenwood.config.js'))).to.be.true;
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
        expect(pkgJson.devDependencies['@greenwood/cli']).to.equal('^0.18.0');
      });
    });

    describe('initial greenwood.config.js contents', function() {
      let greenwoodConfig;

      before(async function() {
        greenwoodConfig = (await import(path.join(outputPath, 'greenwood.config.js'))).default;
      });

      it('should have the correct title configuration', function() {
        expect(greenwoodConfig.title).to.equal('My Project');
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