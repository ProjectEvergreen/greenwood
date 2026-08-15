export async function getStaticPaths() {
  return [];
}

export async function getBody() {
  return "<h2>this page should never be served</h2>";
}
