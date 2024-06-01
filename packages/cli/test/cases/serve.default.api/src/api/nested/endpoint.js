export async function handler() {
  return new Response('I am a nested API route!', {
    headers: new Headers({
      'Content-Type': 'text/html'
    }),
  });
}