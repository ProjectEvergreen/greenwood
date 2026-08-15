export async function getStaticPaths() {
  return [
    {
      params: {
        slug: "alpha",
      },
    },
  ];
}

export async function getBody(compilation, page, request, params) {
  return `<h2>${params.slug}</h2>`;
}
