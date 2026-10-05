import client from "@greenwood/plugin-graphql/src/core/client.js";

export async function getBody() {
  const { data } = await client.query({ query: "{ graph { route } }" });

  return `<h1>GraphQL pages: ${data.graph.length}</h1>`;
}
