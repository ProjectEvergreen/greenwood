export async function handler(request, { params }) {
  return Response.json({ id: params.id, method: request.method });
}
