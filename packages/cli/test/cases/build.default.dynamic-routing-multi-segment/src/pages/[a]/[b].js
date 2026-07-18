export async function getStaticPaths() {
  return [{ params: { a: "x", b: "1" } }, { params: { a: "y", b: "2" } }];
}

export async function getBody(compilation, page, request, params) {
  return `<h2>params=${JSON.stringify(params)}</h2>`;
}
