export async function getStaticPaths() {
  return ["alpha", "costs-$&", "costs-$$", "costs-$`"].map((slug) => ({ params: { slug } }));
}

export async function getBody(compilation, page, request, params) {
  return `<h2>${params.slug}</h2>`;
}
