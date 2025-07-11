import fs from "node:fs/promises";

const ejectConfiguration = async (compilation) => {
  const configFileDirUrl = new URL("../config/", import.meta.url);
  const configFiles = await fs.readdir(configFileDirUrl);

  for (const file of configFiles) {
    const from = new URL(`./${file}`, configFileDirUrl);
    const to = new URL(`./${file}`, compilation.context.projectDirectory);

    await fs.copyFile(from, to);

    console.log(`Ejected ${file} successfully.`);
  }

  console.debug("all configuration files ejected.");
};

export { ejectConfiguration };
