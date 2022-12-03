export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'Greenwood';
  const body = { message: `Hello ${name}!!!???` };

  return new Response(JSON.stringify(body));
}