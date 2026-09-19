export const prerender = true;
export const staticExport = true;

export async function getBody(compilation, page, request) {
  const value = new URL(request.url).searchParams.get("value") ?? "build";

  return `<h1>prerender and static export: ${value}</h1>`;
}
