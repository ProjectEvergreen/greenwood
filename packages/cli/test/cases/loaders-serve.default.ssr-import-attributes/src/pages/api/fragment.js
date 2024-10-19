import { renderFromHTML } from 'wc-compiler';

export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const { html } = await renderFromHTML(`
    <app-card name="${name}"></app-card>
  `, [
    new URL('../../components/card/card.js', import.meta.url)
  ]);

  return new Response(html, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}