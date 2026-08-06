const themes = [
  {
    id: 1,
    json: "alpha",
    label: "Alpha",
  },
  {
    id: 2,
    json: "beta",
    label: "Beta",
  },
];

export async function getStaticPaths() {
  return themes.map((theme) => {
    return {
      params: {
        id: theme.id,
        json: theme.json,
      },
    };
  });
}

export async function getStaticParams({ params }) {
  const theme = themes.find((theme) => theme.id === params.id);

  return { theme };
}

export async function getBody(compilation, request, page, params) {
  return `<h1>${params.theme.label}</h1>`;
}
