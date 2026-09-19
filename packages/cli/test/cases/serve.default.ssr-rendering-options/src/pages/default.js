export async function getBody(compilation, page, request) {
  const value = new URL(request.url).searchParams.get("value") ?? "build";

  return `<h1>default: ${value}</h1>`;
}
