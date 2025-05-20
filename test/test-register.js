import { register } from "node:module";

console.log("@@@@ REGISTER", process.argv);

if (process.argv.filter((arg) => arg.indexOf("greenwood/packages/cli/src/") > 0).length === 1) {
  console.log("@@@@ REGISTER", process.argv);
  register("./test-loader.js", import.meta.url);
}
