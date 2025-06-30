#!/usr/bin/env node

import program from "commander";
import { run } from "./index.js";

const greenwoodPackageJson = (
  await import(new URL("../package.json", import.meta.url), { with: { type: "json" } })
).default;

let command = "";

console.info("-------------------------------------------------------");
console.info(`Welcome to Greenwood (v${greenwoodPackageJson.version}) ♻️`);
console.info("-------------------------------------------------------");

program
  .version(greenwoodPackageJson.version)
  .arguments("<script-mode>")
  .usage("<script-mode> [options]");

program
  .command("build")
  .description("Build a static site for production.")
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command("develop")
  .description("Start a local development server.")
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command("serve")
  .description("View a production build locally with a basic web server.")
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command("eject")
  .option("-a, --all", "eject all configurations including babel, postcss, browserslistrc")
  .description("Eject greenwood configurations.")
  .action((cmd) => {
    command = cmd._name;
  });

program.parse(process.argv);

if (program.parse.length === 0) {
  program.help();
}

run(command);
