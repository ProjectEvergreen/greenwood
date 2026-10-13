export async function handler(request) {
  const { name } = await request.json();

  return Response.json(
    { message: `Thank you ${name} for your submission!` },
    { headers: { "x-secret": "1234" } },
  );
}
