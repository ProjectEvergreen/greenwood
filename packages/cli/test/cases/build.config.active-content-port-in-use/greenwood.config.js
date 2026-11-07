export default {
  activeContent: true,
  staticExport: true,
  devServer: {
    port: Number(process.env.__GWD_TEST_PORT__ ?? 1990),
  },
};
