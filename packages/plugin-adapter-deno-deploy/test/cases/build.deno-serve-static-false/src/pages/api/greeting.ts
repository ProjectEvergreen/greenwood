export async function handler(request: Request) {
  const name = new URL(request.url).searchParams.get("name") ?? "World";

  return Response.json({ message: `Hello ${name}!` });
}
