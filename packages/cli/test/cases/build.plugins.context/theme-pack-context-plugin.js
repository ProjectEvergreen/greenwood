import fs from 'fs/promises';
import os from 'os';
import { spawnSync } from 'child_process';

const packageJson = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePackPlugin = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    const { name } = packageJson;
    const command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
    const ls = spawnSync(command, ['ls', name]);
    
    const isInstalled = ls.stdout.toString().indexOf('(empty)') < 0;
    const templateLocation = isInstalled
      ? new URL(`./node_modules/${name}/dist/layouts/`, import.meta.url)
      : new URL('./fixtures/layouts/', import.meta.url);

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];

export {
  myThemePackPlugin
};