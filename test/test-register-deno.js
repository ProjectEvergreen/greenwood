const registerUrl = new URL("../packages/cli/src/runtimes/deno/register.js", import.meta.url).href;
let registration;

// Root hooks run inside each Mocha worker (and in serial mode), after Mocha has loaded its own dependencies.
// Registering in the coordinator interferes with Deno's require(ESM) resolution and forwards loader flags to Mocha's workers.
export const mochaHooks = {
  async beforeAll() {
    registration ??= import(registerUrl).then(() => {
      // Deno does not expose runtime flags through execArgv. Gallinago needs
      // these explicit arguments when starting Greenwood child processes.
      process.execArgv.push("--import", registerUrl);
    });
    await registration;
  },
};
