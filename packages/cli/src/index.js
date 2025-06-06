#!/usr/bin/env node

import { generateCompilation } from "./lifecycles/compile.js";
import fs from "fs/promises";
import program from "commander";

const greenwoodPackageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf-8"),
);
let cmdOption = {};
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
    cmdOption.all = cmd.all;
  });

program.parse(process.argv);

if (program.parse.length === 0) {
  program.help();
}

const run = async () => {
  process.env.__GWD_COMMAND__ = command;

  try {
    console.info(`Running Greenwood with the ${command} command.`);
    const compilation = await generateCompilation();

    switch (command) {
      case "build":
        await (await import("./commands/build.js")).runProductionBuild(compilation);

        break;
      case "develop":
        await (await import("./commands/develop.js")).runDevServer(compilation);

        break;
      case "serve":
        await (await import("./commands/serve.js")).runProdServer(compilation);

        break;
      case "eject":
        await (await import("./commands/eject.js")).ejectConfiguration(compilation);

        break;
      default:
        console.warn(`
          Error: not able to detect command. try using the --help flag if 
          you're encountering issues running Greenwood.  Visit our docs for more 
          info at https://www.greenwoodjs.dev/.
        `);
        break;
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
