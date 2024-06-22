import { renderFromHTML } from 'wc-compiler';

export async function handler(request: Request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const { html } = await renderFromHTML(`
    <x-greeting name="${name}"></x-greeting>
  `, [
    new URL('../../components/greeting.ts', import.meta.url)
  ]);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}