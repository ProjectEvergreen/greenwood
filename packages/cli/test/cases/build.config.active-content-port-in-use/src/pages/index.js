export async function getBody(compilation) {
  const port = compilation.config.devServer.port;
  const response = await fetch(`http://localhost:${port}/___graph.json`, {
    headers: { "X-CONTENT-KEY": "graph" },
  });
  const graph = await response.json();

  return `<h1>Active content port: ${port}</h1><p>Pages: ${graph.length}</p>`;
}
