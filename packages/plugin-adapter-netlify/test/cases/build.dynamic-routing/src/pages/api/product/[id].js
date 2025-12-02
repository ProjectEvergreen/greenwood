export async function handler(request, { props }) {
  return new Response(`Product id is => ${props.id}`);
}
