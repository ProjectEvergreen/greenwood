export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const body = { message: `Hello ${name}!!!` };

  return new Response(JSON.stringify(body), {
    ok: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}