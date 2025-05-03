#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import fs from "fs";
import { input, select } from "@inquirer/prompts";
import { copyTemplate, setupGitIgnore, setupPackageJson } from "./util.js";

const DEFAULTS = {
  name: "my-app",
  template: "template-base",
  install: false,
  pkgMgr: "npm", // package manager,
  ts: "no",
};

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
      .parse(process.argv)
      .opts();

    // prompt user for all options not passed in via the CLI
    const appName = options.name
      ? options.name
      : await input({
          message: "What is the name of your app? (enter . to use the current directory)",
          default: DEFAULTS.name,
        });

    // if user is started providing options, favor the CLI, otherwise prompt
    const isTS =
      Object.keys(options).length > 0
        ? options.ts
          ? options.ts
          : DEFAULTS.ts
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

    // TODO installDeps: .npmrc?
    // await confirm({ message: 'Would you like to install dependencies?' })
    // console.log({ templateDirUrl, outputDirUrl });
    // if (answers.installDeps) {
    //   answers.packageManager = await checkbox({
    //     message: 'Select a package manager',
    //     choices: [
    //       { name: 'npm', value: 'npm' },
    //       { name: 'yarn', value: 'yarn' },
    //       { name: 'pnpm', value: 'pnpm' },
    //     ],
    //   });
    // }

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

    // TODO: next steps
  } catch (e) {
    console.log(
      `${chalk.rgb(255, 0, 0)("Sorry, there was an error trying to initialize your project")}`,
    );
    console.log(e);
  }
}

init();
