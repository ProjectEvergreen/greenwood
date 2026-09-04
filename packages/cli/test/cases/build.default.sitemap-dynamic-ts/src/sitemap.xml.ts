type SitemapContext = {
  compilation: {
    graph: Array<{ route: string }>;
  };
};

export async function handler(
  request: Request,
  { compilation }: SitemapContext,
): Promise<Response> {
  const urls: string = compilation.graph
    .map((page) => `  <url><loc>http://www.example.com${page.route}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    {
      headers: {
        "Content-Type": "text/xml",
      },
    },
  );
}
