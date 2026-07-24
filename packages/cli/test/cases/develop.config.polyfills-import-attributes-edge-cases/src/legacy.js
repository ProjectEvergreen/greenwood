import data from "./data.json" with { type: "json" };
import legacy from "./config.json" assert { type: "json" };

console.log({ data, legacy });
