import { createHash } from "node:crypto";

function hashString(inputString, length = 8) {
  const bytes = Math.ceil(length / 2);
  const hash = createHash("shake256", { outputLength: bytes }).update(inputString).digest("hex");
  if (length % 2 == 0) {
    return hash;
  }
  return hash.slice(0, length);
}

const HASH_REGEX = "[a-zA-Z0-9-_=]{8}";

export { hashString, HASH_REGEX };
