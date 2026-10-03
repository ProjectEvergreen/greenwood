export async function handler(request: Request) {
  const name = (await request.formData()).get("name");

  return new Response(`Thank you ${name} for your submission!`, {
    headers: { "Content-Type": "text/html" },
  });
}
