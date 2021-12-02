import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPaTh, URL } from 'url';

const packageJson = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePackPlugin = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    const { name } = packageJson;
    const baseDistDir = `node_modules/${name}/dist`;
    const command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
    const ls = spawnSync(command, ['ls', name]);
    
    const isInstalled = ls.stdout.toString().indexOf('(empty)') < 0;
    const templateLocation = isInstalled
      ? path.join(path.dirname(new URL('', import.meta.url).pathname), `${baseDistDir}/layouts`)
      : path.join(process.cwd(), 'fixtures/layouts');

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