export const prerender = true;
export const staticExport = true;

export async function getBody(compilation, page, request) {
  const value = new URL(request.url).searchParams.get("value");
  return `<h1>${value}</h1><app-header data-ssr-content>Preserved SSR content</app-header>`;
}
