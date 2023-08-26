export async function handler(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const body = `Thank you ${name} for your submission!`;

  return new Response(body, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}