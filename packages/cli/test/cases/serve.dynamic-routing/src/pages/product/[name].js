export async function getBody(compilation, request, page, params) {
  return `<h1>${params.name}</h1>`;
}
