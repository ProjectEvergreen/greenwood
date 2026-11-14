export const prerender = true;

export async function getBody(compilation, page, request, params) {
  return `<h1>${params.slug}</h1><app-header data-ssr-content>Preserved dynamic SSR content</app-header>`;
}
