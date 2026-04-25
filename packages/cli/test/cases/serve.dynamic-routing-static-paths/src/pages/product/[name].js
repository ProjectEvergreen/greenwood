const products = [
  {
    id: 1,
    name: "My Cool Product",
  },
  {
    id: 2,
    name: "My Other Cool Product",
  },
];

export async function getStaticPaths() {
  return products.map((product) => {
    return {
      params: {
        id: product.id,
        name: product.name.replace(/ /g, "-").toLowerCase(),
      },
    };
  });
}

export async function getStaticParams({ params }) {
  const product = products.find((product) => product.id === params.id);

  return { product };
}

export async function getBody(compilation, request, page, params) {
  return `<h1>${params.product.name}</h1>`;
}
