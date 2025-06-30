#!/usr/bin/env node

import chalk from "chalk";
import { program, Option } from "commander";
import fs from "fs";
import { input, select } from "@inquirer/prompts";
import { copyTemplate, installDependencies, setupGitIgnore, setupPackageJson } from "./util.js";

const DEFAULTS = {
  name: "my-app",
  template: "template-base",
  install: "no",
  ts: "no",
};

const PACKAGE_MANAGERS = [
  {
    name: "npm",
    value: "npm",
  },
  {
    name: "pnpm",
    value: "pnpm",
  },
  {
    name: "Yarn",
    value: "yarn",
  },
];

async function init() {
  try {
    const CWD = process.cwd();
    const packageJson = // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
      (await import(new URL("../package.json", import.meta.url), { with: { type: "json" } }))
        .default;
    const { name, version } = packageJson;

    console.log(
      `${chalk.rgb(175, 207, 71)("-------------------------------------------------------")}`,
    );
    console.log(`${chalk.rgb(175, 207, 71)(`Initialize a Greenwood Project (v${version}) ♻️`)}`);
    console.log(
      `${chalk.rgb(175, 207, 71)("-------------------------------------------------------")}`,
    );

    const options = program
      .name(name)
      .version(version)
      .option("-y, --yes", "Accept all default options")
      .option("--name <name>", "Name and directory location to scaffold your application with")
      .addOption(
        new Option("--ts [choice]", "Optionally configure your project with TypeScript")
          .choices(["yes", "no"])
          .default(DEFAULTS.ts),
      )
      .addOption(
        new Option(
          "-i, --install <choice>",
          "Install dependencies with the package manager of your choice",
        )
          .choices(PACKAGE_MANAGERS.map((manager) => manager.name.toLowerCase()).concat("no"))
          .default(DEFAULTS.install),
      )
      .parse(process.argv)
      .opts();

    const appName = options?.yes
      ? DEFAULTS.name
      : options.name
        ? options.name
        : await input({
            message: "What is the name of your app? (enter . to use the current directory)",
            default: DEFAULTS.name,
          });

    const isTS = options?.yes
      ? DEFAULTS.ts
      : options?.ts
        ? options?.ts === true
          ? "yes"
          : options.ts
        : await select({
            message: "Setup TypeScript?",
            choices: [
              {
                name: "Yes",
                value: "yes",
              },
              {
                name: "No",
                value: "no",
              },
            ],
          });

    const packageManager = options.yes
      ? DEFAULTS.install
      : options?.install
        ? options.install
        : await select({
            message: "Install Dependencies?",
            choices: [
              ...PACKAGE_MANAGERS,
              {
                name: "no (I will install dependencies myself)",
                value: "no",
              },
            ],
          });

    // determine source (template) and output locations
    const templateDirUrl =
      isTS === "yes"
        ? new URL(`./${DEFAULTS.template}-ts/`, import.meta.url)
        : new URL(`./${DEFAULTS.template}/`, import.meta.url);

    const outputDirUrl =
      appName === "." ? new URL(`file://${CWD}/`) : new URL(`./${appName}/`, `file://${CWD}/`);

    // make output directory if an appName is specified
    if (appName !== ".") {
      try {
        await fs.promises.access(outputDirUrl);

        console.log(
          `${chalk.rgb(175, 207, 71)("output directory detected, skipping creation...")}`,
        );
      } catch {
        console.log(`creating output directory => ${appName}`);
        fs.mkdirSync(outputDirUrl);
      }
    } else {
      console.log("using current directory for the output directory");
    }

    // copy template files
    copyTemplate(templateDirUrl, outputDirUrl);

    // configure package.json (name, greenwood version, etc)
    setupPackageJson(outputDirUrl, {
      name: appName,
      version,
    });

    // configure .gitignore file contents
    setupGitIgnore(outputDirUrl);

    installDependencies(outputDirUrl, packageManager);

    // provide any next steps to the user
    const instructions = [];

    if (appName !== ".") {
      instructions.push(`Run \`cd ${appName}\``);
    }

    if (packageManager === "no") {
      instructions.push(`Install dependencies with your preferred package manager`);
      instructions.push(`Run the dev script`);
    } else {
      instructions.push(`Run \`${packageManager} run dev\` to start the dev server`);
    }

    if (instructions.length > 0) {
      console.log(`${chalk.rgb(175, 207, 71)("--- Next Steps ---")}`);

      instructions.forEach((instruction, idx) => {
        console.log(`${chalk.rgb(175, 207, 71)(`${idx + 1}) ${instruction}`)}`);
      });
    }
  } catch (e) {
    console.log(
      `${chalk.rgb(255, 0, 0)("Sorry, there was an error trying to initialize your project")}`,
    );
    console.log(e);
  }
}

init();
