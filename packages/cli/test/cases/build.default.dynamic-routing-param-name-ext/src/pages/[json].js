export async function getStaticPaths() {
  return [{ params: { json: "alpha" } }];
}

export async function getBody(compilation, page, request, params) {
  return `<h2>params=${JSON.stringify(params)}</h2>`;
}
