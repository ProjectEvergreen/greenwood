import { generateCompilation } from "./lifecycles/compile.js";
import { writeSync } from "node:fs";
import { format } from "node:util";

async function run(command) {
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
    // TODO: remove this once we have a better error handling strategy in place for the CLI
    writeSync(process.stderr.fd, `${format(err)}\n`);
    process.exit(1);
  }
}

export { run };
