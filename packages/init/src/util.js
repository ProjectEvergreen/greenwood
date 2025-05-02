import fs from "fs";
import os from "os";
import path from "path";

function copyTemplate(templateDirUrl, outputDirUrl) {
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
  const packageJsonUrl = new URL("./package.json", outputDirUrl);
  const json = JSON.parse(fs.readFileSync(packageJsonUrl));

  json.name = name === "." ? path.basename(packageJsonUrl) : name;
  json.version = version;
  json.devDependencies["@greenwood/cli"] = `~${version}`;

  fs.writeFileSync(packageJsonUrl, JSON.stringify(json, null, 2));
}

function setupGitIgnore(outputDirUrl, { patterns = [] } = {}) {
  const ignorePatterns = ["*DS_Store", "*.log", "node_modules/", "public/", ".greenwood/"];
  let contents = "";

  ignorePatterns.concat(patterns).forEach((pattern) => {
    contents = contents.concat(pattern, os.EOL);
  });

  fs.writeFileSync(new URL("./.gitignore", outputDirUrl), contents);
}

export { copyTemplate, setupPackageJson, setupGitIgnore };
