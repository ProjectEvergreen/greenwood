async function getTemplate() {
  return `
    <html>
      <body>
        <h1>Hello from the artists page!!!</h1>
      </body>
    </html>
  `;
}

async function getPage() {
  return '<h1>Content goes here</h1>';
}

async function getMetadata() {
  return { meta: 'data' };
}

module.exports = {
  getTemplate,
  getPage,
  getMetadata
};