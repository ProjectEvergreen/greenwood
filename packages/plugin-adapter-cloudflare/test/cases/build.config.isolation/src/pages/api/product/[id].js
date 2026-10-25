let requests = 0;

export async function handler(request, { params }) {
  requests++;
  const body = request.method === "POST" ? await request.json() : null;

  return Response.json(
    { id: params.id, method: request.method, body, requests },
    { status: 201, headers: { "x-isolated": "true" } },
  );
}
