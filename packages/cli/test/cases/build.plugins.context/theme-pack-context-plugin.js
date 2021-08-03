const os = require('os');
const path = require('path');
const packageJson = require('./package.json');
const { spawnSync } = require('child_process');

module.exports = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: (compilation) => {
    const { name } = packageJson;
    const baseDistDir = `node_modules/${name}/dist`;
    const command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
    const { projectDirectory } = compilation.context;
    const ls = spawnSync(command, ['ls', name]);
    
    const isInstalled = ls.stdout.toString().indexOf('(empty)') < 0;
    const templateLocation = isInstalled
      ? path.join(projectDirectory, `${baseDistDir}/layouts`)
      : path.join(process.cwd(), 'fixtures/layouts');

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];