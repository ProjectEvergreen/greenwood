async function generateSitemap(compilation) {
  const urls = compilation.graph.map((page) => {
    return `    <url>
      <loc>http://www.example.com${page.route}</loc>
    </url>`;
  });

  return `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
      `;
}

export { generateSitemap };