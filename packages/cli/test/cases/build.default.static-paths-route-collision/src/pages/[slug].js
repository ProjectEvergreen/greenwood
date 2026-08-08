export async function getStaticPaths() {
  return [{ params: { slug: "about" } }, { params: { slug: "contact" } }];
}

export async function getBody(compilation, page, request, params) {
  return `
    <h1>Dynamic Page</h1>
    <p>${params.slug}</p>
  `;
}
