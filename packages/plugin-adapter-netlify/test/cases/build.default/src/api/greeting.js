import { getMessage } from '../services/message.js';

export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'Greenwood';
  const body = { message: getMessage(name) };
  const headers = new Headers();

  headers.append('Content-Type', 'application/json');

  return new Response(JSON.stringify(body), {
    headers
  });
}