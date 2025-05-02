import fs from "fs";
import path from "path";

function copyTemplate(templateDirUrl, outputDirUrl) {
  const files = fs.readdirSync(templateDirUrl, { recursive: true });

  files.forEach((file) => {
    const templateFileUrl = new URL(`./${file}`, templateDirUrl);
    const outputFileUrl = new URL(`./${file}`, outputDirUrl);

    if (fs.lstatSync(templateFileUrl).isDirectory()) {
      fs.mkdirSync(outputFileUrl);
    } else {
      fs.copyFileSync(templateFileUrl, outputFileUrl);
    }
  });
}

function setupPackageJson(targetFileUrl, { name, version }) {
  const json = JSON.parse(fs.readFileSync(targetFileUrl));

  json.name =
    name === "." ? path.basename(targetFileUrl.pathname.replace("package.json", "")) : name;
  json.version = version;
  json.devDependencies["@greenwood/cli"] = `~${version}`;

  fs.writeFileSync(targetFileUrl, JSON.stringify(json, null, 2));
}

export { copyTemplate, setupPackageJson };
