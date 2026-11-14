import os from "node:os";

export default {
  timeout: 90000,
  parallel: true,
  jobs: os.availableParallelism(),
};
