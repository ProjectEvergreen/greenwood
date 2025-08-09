const initContext = async ({ config }) => {
  const { workspace, pagesDirectory, layoutsDirectory } = config;

  const userWorkspace = workspace;
  const projectDirectory = new URL(`file://${process.cwd()}/`);
  const scratchDir = new URL("./.greenwood/", projectDirectory);
  const outputDir = new URL("./public/", projectDirectory);
  const dataDir = new URL("../data/", import.meta.url);
  const layoutsDir = new URL(`./${layoutsDirectory}/`, userWorkspace);
  const pagesDir = new URL(`./${pagesDirectory}/`, userWorkspace);
  const apisDir = new URL("./api/", pagesDir);

  const context = {
    dataDir,
    outputDir,
    userWorkspace,
    apisDir,
    pagesDir,
    scratchDir,
    projectDirectory,
    layoutsDir,
  };

  return Promise.resolve(context);
};

export { initContext };
