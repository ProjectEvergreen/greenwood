let requests = 0;

export function handler() {
  return Response.json({ message: "Hello World!", requests: ++requests });
}
