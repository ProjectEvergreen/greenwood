// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2775538
import { createHash } from "node:crypto";

function hashString(inputString, length = 8) {
  const hash = createHash("md5").update(inputString).digest("hex");
  return hash.length <= length ? hash : hash.slice(0, length);
}

export { hashString };
