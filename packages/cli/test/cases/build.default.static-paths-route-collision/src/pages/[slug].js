export async function getStaticPaths() {
  return ["about", "contact", "café", "hello world", "exported", "runtime"].map((slug) => ({
    params: { slug },
  }));
}

export async function getBody(compilation, page, request, params) {
  return `
    <h1>Dynamic Page</h1>
    <p>${params.slug}</p>
  `;
}
