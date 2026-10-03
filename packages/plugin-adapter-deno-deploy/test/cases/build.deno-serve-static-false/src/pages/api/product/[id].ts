export async function handler(request: Request, { params }: { params: { id: string } }) {
  return Response.json({ id: params.id, method: request.method });
}
