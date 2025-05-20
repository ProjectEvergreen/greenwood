import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

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

  const packageJsonUrl = new URL("./package.json", outputDirUrl);
  const json = JSON.parse(fs.readFileSync(packageJsonUrl));
  const devDeps = json.devDependencies;

  json.name = name === "." ? path.basename(outputDirUrl.pathname) : name;
  json.version = version;

  // ensure all Greenwood deps have their version set to the version from the CLI's package.json
  for (const dep in devDeps) {
    if (dep.startsWith("@greenwood/")) {
      // we should change this to a ^ once Greenwood reaches 1.0
      json.devDependencies[dep] = `~${version}`;
    }
  }

  fs.writeFileSync(packageJsonUrl, JSON.stringify(json, null, 2));
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

  const command = os.platform() === "win32" ? `${packageManager}.cmd` : packageManager;
  const args = ["install", "--loglevel", "error"];
  let npmrcContents = "";

  if (packageManager === "npm") {
    npmrcContents = npmrcContents.concat("legacy-peer-deps=true", os.EOL);
  } else if (packageManager === "pnpm") {
    npmrcContents = npmrcContents.concat("shamefully-hoist=true", os.EOL);
  }

  if (npmrcContents !== "") {
    fs.writeFileSync(new URL("./.npmrc", outputDirUrl), npmrcContents);
  }

  spawnSync(command, args, { stdio: "inherit", cwd: outputDirUrl, shell: true });
}

export { copyTemplate, installDependencies, setupPackageJson, setupGitIgnore };
