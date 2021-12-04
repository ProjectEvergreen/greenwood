import fs from 'fs';
import { fileURLToPath, URL } from 'url';

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
  const dataPath = fileURLToPath(new URL('../../package.json', import.meta.url));
  const data = JSON.parse(await fs.promises.readFile(dataPath, 'utf-8'));

  const { version } = data;

  return { version };
};

export {
  getTemplate,
  getData
};