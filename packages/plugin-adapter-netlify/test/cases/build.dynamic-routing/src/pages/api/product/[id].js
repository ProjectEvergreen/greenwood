export async function handler(request, { params }) {
  return new Response(`Product id is => ${params.id}`);
}
