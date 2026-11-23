import glob from "glob-promise";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function tagsMatch(tagName, html, expected = null) {
  const openTagRegex = new RegExp(`<${tagName}`, "g");
  const closeTagRegex = new RegExp(`</${tagName.replace(">", "")}>`, "g");
  const openingCount = (html.match(openTagRegex) || []).length;
  const closingCount = (html.match(closeTagRegex) || []).length;
  const expectedMatches = parseInt(expected, 10) ? expected : openingCount;

  return openingCount === closingCount && openingCount === expectedMatches;
}

function getOutputTeardownFiles(outputUrl) {
  return [
    new URL(".greenwood/", outputUrl),
    new URL("public/", outputUrl),
    new URL("node_modules/", outputUrl),
  ];
}

async function getDependencyFiles(sourceUrl, outputUrl) {
  const files = await glob(fileURLToPath(sourceUrl));

  return files.map((file) => ({
    source: pathToFileURL(file),
    destination: new URL(encodeURIComponent(path.basename(file)), outputUrl),
  }));
}

const HASH_REGEX = "[a-zA-Z0-9-_]{8}";

export { getDependencyFiles, getOutputTeardownFiles, tagsMatch, HASH_REGEX };
