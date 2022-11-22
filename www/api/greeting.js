export async function handler(request, response) {
  console.debug({ request, response });
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'Greenwood';

  console.debug({ params });
  console.debug({ name });

  // TODO use Response
  return { message: `Hello ${name}!!!` };
}