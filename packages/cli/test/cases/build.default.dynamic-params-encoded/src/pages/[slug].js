export async function getStaticPaths() {
  return [{ params: { slug: "café" } }, { params: { slug: "100%" } }];
}

export async function getBody(compilation, page, request, params) {
  return `<h2>${params.slug}</h2>`;
}
