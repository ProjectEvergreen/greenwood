import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const getTemplate = async (data) => {
  return `
    <app-footer>
      <footer class="footer">
        <h4>Greenwood v${data.version}</h4>
      </footer>
    </app-footer>
  `;
};

const getData = async () => {
  const dataPath = path.join(new URL('', import.meta.url).pathname, '../../../package.json');
  const data = JSON.parse(await fs.promises.readFile(dataPath, 'utf-8'));

  const { version } = data;

  return { version };
};

export {
  getTemplate,
  getData
};