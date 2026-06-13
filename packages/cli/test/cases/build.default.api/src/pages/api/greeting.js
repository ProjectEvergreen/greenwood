import assert from "node:assert/strict";

// tests that API routes don't execute at build time
// https://github.com/ProjectEvergreen/greenwood/issues/1690
assert(process.env.NODE_ENV);

export default function handler() {
  return new Response("Hello World");
}
