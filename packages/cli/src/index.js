import { generateCompilation } from "./lifecycles/compile.js";

const run = async (command) => {
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
      case "eject":
        await (await import("./commands/eject.js")).ejectConfiguration(compilation);

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
    console.error(err);
    process.exit(1);
  }
};

export { run };
