export async function handler(request) {
  // TODO const formData = await request.formData()
  const formData = await request.json();
  const { name } = formData;
  const body = `Thank you ${name} for your submission!`;

  // TODO get custom header working
  return new Response(body, {
    headers: new Headers({
      'Content-Type': 'text/html',
      'x-secret': 1234
    })
  });
}