async function getBody(compilation, page) {
  return `
    <body>
      <h1 class="page-id">${page.id}</h1>
      <h2 class="page-route">${page.route}</h2>
      <h3 class="page-title">${page.title}</h3>
    </body>
  `;
}

async function getFrontmatter() {
  return {
    title: "My Page Object Page",
  };
}

export { getBody, getFrontmatter };
