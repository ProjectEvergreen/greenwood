export const prerender = true;

export async function getBody(compilation, page, request) {
  const value = new URL(request.url).searchParams.get("value") ?? "build";

  return `<h1>prerender: ${value}</h1>`;
}
