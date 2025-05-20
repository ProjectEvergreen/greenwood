import { register } from "node:module";

if (process.argv.filter((arg) => arg.endsWith(".bin/greenwood")).length === 1) {
  register("./loader.js", import.meta.url);
}
