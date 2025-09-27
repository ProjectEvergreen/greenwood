import glob from "glob-promise";
import path from "node:path";

function tagsMatch(tagName, html, expected = null) {
  const openTagRegex = new RegExp(`<${tagName}`, "g");
  const closeTagRegex = new RegExp(`</${tagName.replace(">", "")}>`, "g");
  const openingCount = (html.match(openTagRegex) || []).length;
  const closingCount = (html.match(closeTagRegex) || []).length;
  const expectedMatches = parseInt(expected, 10) ? expected : openingCount;

  return openingCount === closingCount && openingCount === expectedMatches;
}

function getOutputTeardownFiles(outputPath) {
  return [
    path.join(outputPath, ".greenwood"),
    path.join(outputPath, "public"),
    path.join(outputPath, "node_modules"),
  ];
}

async function getDependencyFiles(sourcePath, outputPath) {
  const files = await glob(sourcePath);

  return files.map((lib) => {
    return {
      source: path.join(lib),
      destination: path.join(outputPath, path.basename(lib)),
    };
  });
}

const HASH_REGEX = "[a-zA-Z0-9-_]{8}";

export { getDependencyFiles, getOutputTeardownFiles, tagsMatch, HASH_REGEX };
