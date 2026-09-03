import "../packages/cli/src/runtimes/deno/register.js";

const registerUrl = new URL("../packages/cli/src/runtimes/deno/register.js", import.meta.url).href;

// Deno does not expose its runtime flags through process.execArgv. Publish the loader registration
// arguments explicitly so Gallinago can forward them to Greenwood's child processes.
process.execArgv.push("--import", registerUrl);
