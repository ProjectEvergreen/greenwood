import net from "node:net";

// Read a complete startup line: stdout chunks may split both the message and URL.
function startServer(runner, cliPath, command, { pattern, timeout = 30000 } = {}) {
  const ready =
    pattern ??
    (command === "develop"
      ? /Started local development server at (http:\/\/\S+)\r?\n/
      : /Started server at (http:\/\/\S+)\r?\n/);

  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(new Error(`${command} command did not become ready:\n${output}`));
    }, timeout);
    const fail = (error) => {
      clearTimeout(timer);
      reject(error);
    };

    runner
      .runCommand(cliPath, command, {
        onStdOut: (message) => {
          output += message;
          const match = output.match(ready);

          if (match) {
            clearTimeout(timer);
            const url = new URL(match[1]);

            // Apollo may report a wildcard bind address on Deno and Windows.
            if (url.hostname === "0.0.0.0" || url.hostname === "[::]") {
              url.hostname = "localhost";
            }

            resolve(url.origin);
          }
        },
      })
      .then(
        () => fail(new Error(`${command} command exited before server readiness:\n${output}`)),
        fail,
      );
  });
}

async function stopServer(runner) {
  const child = runner.childProcess;

  // Gallinago waits for an exit event, which has already fired if startup failed.
  if (child?.exitCode === null && child?.signalCode === null) {
    await runner.stopCommand();
  }
}

// Configurable port-fallback tests reserve an OS-assigned port. Regressions for
// fixed defaults wait for another test's server to release the port.
async function occupyPort(port = 0) {
  const server = net.createServer();
  const deadline = Date.now() + 30000;

  for (;;) {
    try {
      await new Promise((resolve, reject) => {
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
        server.listen(port);
      });
      // Leave room for the active-content and prerender fallback listeners.
      if (port === 0 && server.address().port >= 65533) {
        await new Promise((resolve) => server.close(resolve));
        continue;
      }
      return server;
    } catch (error) {
      if (error.code !== "EADDRINUSE" || Date.now() >= deadline) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
}

export { startServer, stopServer, occupyPort };
