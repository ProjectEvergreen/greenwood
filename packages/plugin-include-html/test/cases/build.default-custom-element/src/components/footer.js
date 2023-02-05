import fs from 'fs/promises';

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
  const dataUrl = new URL('../../package.json', import.meta.url);
  const data = JSON.parse(await fs.readFile(dataUrl, 'utf-8'));
  const { version } = data;

  return { version };
};

export {
  getTemplate,
  getData
};