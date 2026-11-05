export async function handler(request) {
  const data = await request.formData();

  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode("Hello "));
      controller.enqueue(encoder.encode(`${data.get("name")}!`));
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "content-type": "text/plain" },
  });
}
