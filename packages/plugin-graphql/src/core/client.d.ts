declare module "@greenwood/plugin-graphql/src/core/client.js" {
  const Client: {
    query: (params: string) => Promise<Response>;
  };

  export default Client;
}
