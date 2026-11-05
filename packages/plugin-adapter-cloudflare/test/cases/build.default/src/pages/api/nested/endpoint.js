export async function handler() {
  return new Response("Nested API route", {
    headers: { "Content-Type": "text/plain" },
  });
}
