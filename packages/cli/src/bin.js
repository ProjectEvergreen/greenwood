#!/usr/bin/env node

import { parseArgs } from "node:util";
import { run } from "./index.js";

const greenwoodPackageJson = (
  await import(new URL("../package.json", import.meta.url), { with: { type: "json" } })
).default;

const banner = () => {
  console.info("-------------------------------------------------------");
  console.info(`Welcome to Greenwood (v${greenwoodPackageJson.version}) ♻️`);
  console.info("-------------------------------------------------------");
};

const helpText = `
Usage: bin <script-mode> [options]

Options:
  -V, --version    output the version number
  -h, --help       output usage information

Commands:
  build            Build a static site for production.
  develop          Start a local development server.
  serve            View a production build locally with a basic web server.
`;

const options = {
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "V" },
  },
  allowPositionals: true,
  stopAtPositional: true,
};

const CommandsEnum = {
  BUILD: "build",
  DEVELOP: "develop",
  SERVE: "serve",
};

banner();

const { values, positionals } = parseArgs(options);
const command = positionals[0];

// --help
if (values.help) {
  console.log(helpText);
  process.exit(0);
}

// --version
if (values.version) {
  console.log(greenwoodPackageJson.version);
  process.exit(0);
}

// no command -> show help
if (!command) {
  console.log(helpText);
  process.exit(0);
}

// unknown command
if (!Object.values(CommandsEnum).includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.log(helpText);
  process.exit(1);
}

// valid command
await run(command);
