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
  const version = require('../../package.json').version;

  return { version };
};

module.exports = {
  getTemplate,
  getData
};