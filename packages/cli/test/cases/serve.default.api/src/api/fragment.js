import { renderFromHTML } from 'wc-compiler';

export async function handler(request) {
  const headers = new Headers();
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const { html } = await renderFromHTML(`
    <x-card name="${name}"></x-card>
  `, [
    new URL('../components/card.js', import.meta.url)
  ]);

  headers.append('Content-Type', 'text/html');

  return new Response(html, {
    headers
  });
}