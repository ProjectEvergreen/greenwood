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
Usage: greenwood <command>

Options:
  -h, --help       Show help information
  -V, --version    Show version number

Commands:
  build            Generate a production build.
  develop          Start a local development server.
  serve            Start a production server.
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
run(command);
