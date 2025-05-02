#!/usr/bin/env node
/* eslint no-console: 0 */
/*
 * **Note**
 * For the time being, there is an issue that prevents us from running the install based specs for this package as part of CI.
 * https://github.com/ProjectEvergreen/greenwood/issues/787
 *
 * When adding new features to this package, please enable the tests locally and validate that the scaffolding works
 * correctly.  This applies to the following test cases:
 * - build.default
 * - develop.default
 * - init.yarn
 *
 */
import chalk from "chalk";
// import simpleGit from "simple-git";
import { program } from "commander";
import fs from "fs";
// // import os from "os";
// import { spawn } from "child_process";
import { checkbox, confirm, input } from "@inquirer/prompts";
import { copyTemplate, setupPackageJson } from "./util.js";

const DEFAULTS = {
  name: "my-app",
  template: "template-base",
};

async function init() {
  try {
    const CWD = process.cwd();
    const packageJson = (
      await import(new URL("../package.json", import.meta.url), { with: { type: "json" } })
    ).default;
    const { name, version } = packageJson;

    program
      .name(name)
      .version(version)
      // .usage(`${chalk.green("<application-directory>")} [options]`)
      .option("--name <name>", "Name and directory location to scaffold your application with")
      // .option("--install", "Install dependencies upon init")
      // .option("--template [type]", "Select from list of Greenwood curated templates")
      .parse(process.argv);
    // .opts();

    console.log(
      `${chalk.rgb(175, 207, 71)("-------------------------------------------------------")}`,
    );
    console.log(`${chalk.rgb(175, 207, 71)(`Initialize a Greenwood Project (v${version}) ♻️`)}`);
    console.log(
      `${chalk.rgb(175, 207, 71)("-------------------------------------------------------")}`,
    );

    const options = program.opts();

    const appName = options.name
      ? options.name
      : await input({
          message: "What is the name of your app? (enter . to use the current directory)",
          default: DEFAULTS.name,
        });

    const templateDirUrl = new URL(`./${DEFAULTS.template}/`, import.meta.url);
    const outputDirUrl =
      appName === "." ? new URL(`file://${CWD}/`) : new URL(`./${appName}/`, `file://${CWD}/`);

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

    // make output directory if an appName is specified
    if (appName !== ".") {
      try {
        await fs.promises.access(outputDirUrl);

        console.log(
          `${chalk.rgb(175, 207, 71)("output directory detected, skipping creation...")}`,
        );
      } catch {
        fs.mkdirSync(outputDirUrl);
      }
    }

    // copy template files
    copyTemplate(templateDirUrl, outputDirUrl);

    // configure package.json (name, greenwood version, etc)
    setupPackageJson(new URL(`./package.json`, outputDirUrl), {
      name: appName,
      version,
    });

    // TODO installDeps: .npmrc?
    // await confirm({ message: 'Would you like to install dependencies?' })

    // TODO: .gitignore
    // TODO: next steps
  } catch (e) {
    console.log(
      `${chalk.rgb(255, 0, 0)("Sorry, there was an error trying to initialize your project")}`,
    );
    console.log(e);
  }
}

init();
