import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function copyTemplate(templateDirUrl, outputDirUrl) {
  console.log("copying project files to => ", outputDirUrl.pathname);

  const files = fs.readdirSync(templateDirUrl, { recursive: true });

  files.forEach((file) => {
    const templateFileUrl = new URL(`./${file}`, templateDirUrl);
    const outputFileUrl = new URL(`./${file}`, outputDirUrl);
    const isDir = fs.lstatSync(templateFileUrl).isDirectory();

    if (isDir && !fs.existsSync(outputFileUrl)) {
      fs.mkdirSync(outputFileUrl);
    } else if (!isDir) {
      fs.copyFileSync(templateFileUrl, outputFileUrl);
    }
  });
}

function setupPackageJson(outputDirUrl, { name, version }) {
  console.log("setting up package.json...");

  const packageJsonOutputUrl = new URL("./package.json", outputDirUrl);
  const pkgJson = JSON.parse(fs.readFileSync(packageJsonOutputUrl));
  const json = {};

  // setup standard fields
  json.name = name === "." ? path.basename(outputDirUrl.pathname) : name;
  json.version = "0.1.0";
  json.type = "module";
  json.scripts = pkgJson.scripts;

  // add / merge Greenwood dependencies (first)
  json.devDependencies = {
    "@greenwood/cli": `~${version}`,
    ...(pkgJson.devDependencies ?? {}),
  };

  fs.writeFileSync(packageJsonOutputUrl, JSON.stringify(json, null, 2));
}

function setupGitIgnore(outputDirUrl, { patterns = [] } = {}) {
  console.log("creating a .gitignore file...");

  const ignorePatterns = ["*DS_Store", "*.log", "node_modules/", "public/", ".greenwood/"];
  let contents = "";

  ignorePatterns.concat(patterns).forEach((pattern) => {
    contents = contents.concat(pattern, os.EOL);
  });

  fs.writeFileSync(new URL("./.gitignore", outputDirUrl), contents);
}

function installDependencies(outputDirUrl, packageManager) {
  if (packageManager === "no") {
    return;
  }

  console.log(`installing dependencies using => ${packageManager}...`);

  const isWindows = os.platform() === "win32";
  const configuredShell = process.env.SHELL;
  const isWindowsPosixShell =
    isWindows && configuredShell && /(?:^|[\\/])(?:ba|z|fi)?sh(?:\.exe)?$/i.test(configuredShell);
  const shell = isWindowsPosixShell ? configuredShell.split(/[\\/]/).at(-1) : true;
  const command = isWindows && !isWindowsPosixShell ? `${packageManager}.cmd` : packageManager;
  const args = ["install", "--loglevel", "error"];
  let npmrcContents = "";

  switch (packageManager) {
    case "npm":
      // shouldn't be an issue in later Greenwood releases since we manually bump plugin peer deps manually
      // due to this issue in Lerna - https://github.com/lerna/lerna/issues/955
      // so keeping it just to be safe and provide consistent behavior
      // https://stackoverflow.com/a/66620869/417806
      npmrcContents = npmrcContents.concat("legacy-peer-deps=true", os.EOL);
      break;
    case "pnpm":
      // enable this since in some cases we need plugin dependencies installed "locally" to the project
      // https://pnpm.io/settings#shamefullyhoist
      // https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-renderer-lit#installation
      npmrcContents = npmrcContents.concat("shamefully-hoist=true", os.EOL);
      break;
  }

  if (npmrcContents !== "") {
    fs.writeFileSync(new URL("./.npmrc", outputDirUrl), npmrcContents);
  }

  const result = spawnSync(`${command} ${args.join(" ")}`, {
    stdio: "inherit",
    cwd: outputDirUrl,
    shell,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${packageManager} install failed with exit code ${result.status}`);
  }
}

export { copyTemplate, installDependencies, setupPackageJson, setupGitIgnore };
