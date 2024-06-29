export async function handler(request) {
  const data = await request.json();
  const { name } = data;
  const body = { message: `Thank you ${name} for your submission!` };

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      'Content-Type': 'application/json',
      'x-secret': 1234
    })
  });
}