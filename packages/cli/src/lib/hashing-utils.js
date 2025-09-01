import { createHash } from "node:crypto";

function hashString(inputString, length = 8) {
  return createHash("md5").update(inputString).digest("hex").slice(0, length);
}

const HASH_8_REGEX = "[a-zA-Z0-9]{8}";

export { hashString, HASH_8_REGEX };
