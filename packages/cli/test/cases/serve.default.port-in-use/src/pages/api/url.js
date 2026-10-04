export function handler(request) {
  return Response.json({ url: request.url });
}
