#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
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
    const packageJson = (
      await import(new URL("../package.json", import.meta.url), { with: { type: "json" } })
    ).default;
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
      // TODO ? .usage(`${chalk.green("<application-directory>")} [options]`)
      .option("--name <name>", "Name and directory location to scaffold your application with")
      .option("--ts <choice>", "Configure the project for TypeScript (yes/no)")
      .option(
        "--install <choice>",
        "Install dependencies with the package manager of your choice (npm/pnpm/yarn)",
      )
      .parse(process.argv)
      .opts();

    const appName = options.name
      ? options.name
      : await input({
          message: "What is the name of your app? (enter . to use the current directory)",
          default: DEFAULTS.name,
        });

    const isTS = options?.ts
      ? options.ts === "yes"
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

    const packageManager = options?.install
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

    // TODO: next steps / instructions
  } catch (e) {
    console.log(
      `${chalk.rgb(255, 0, 0)("Sorry, there was an error trying to initialize your project")}`,
    );
    console.log(e);
  }
}

init();
