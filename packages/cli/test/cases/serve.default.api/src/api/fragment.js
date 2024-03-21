import { renderFromHTML } from 'wc-compiler';

export const isolation = true;

export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const { html } = await renderFromHTML(`
    <x-card name="${name}"></x-card>
  `, [
    new URL('../components/card.js', import.meta.url)
  ]);

  return new Response(html, {
    headers: new Headers({
      'Content-Type': 'text/html'
    }),
    statusText: 'SUCCESS!!!'
  });
}