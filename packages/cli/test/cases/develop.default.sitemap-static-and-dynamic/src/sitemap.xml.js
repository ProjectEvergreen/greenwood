export async function handler() {
  return new Response("<urlset><url><loc>http://www.example.com/dynamic/</loc></url></urlset>", {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
