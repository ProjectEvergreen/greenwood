export const isolation = true;
let requests = 0;

export function handler(request, { params }) {
  return Response.json({ id: params.id, requests: ++requests });
}
