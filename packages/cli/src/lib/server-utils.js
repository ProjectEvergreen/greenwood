import net from "node:net";

const MAX_PORT = 65535;

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);

    try {
      server.listen(port);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

async function startServerOnAvailablePort(startServer, preferredPort) {
  let port = preferredPort;

  while (port <= MAX_PORT) {
    try {
      const server = await startServer(port);

      return { port, server };
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }

      port += 1;
    }
  }

  throw new Error(`Unable to find an available port at or above ${preferredPort}.`);
}

async function listenOnAvailablePort(server, preferredPort) {
  const { port } = await startServerOnAvailablePort(async (port) => {
    await listen(server, port);

    return server;
  }, preferredPort);

  return port;
}

async function getAvailablePort(preferredPort) {
  const server = net.createServer();
  const port = await listenOnAvailablePort(server, preferredPort);

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  return port;
}

export { getAvailablePort, listenOnAvailablePort, startServerOnAvailablePort };
