export async function handler(request: Request) {
  const { name } = (await request.json()) as { name: string };

  return Response.json(
    { message: `Thank you ${name} for your submission!` },
    { headers: { "x-secret": "1234" } },
  );
}
