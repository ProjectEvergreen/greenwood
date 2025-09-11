import { createHash } from "node:crypto";

function hashString(inputString, length = 8) {
  const bytes = Math.ceil(length / 2);
  const hash = createHash("shake256", { outputLength: bytes })
    .update(inputString)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "_");

  if (length % 2 == 0) {
    return hash;
  }
  return hash.slice(0, length);
}

export { hashString };
