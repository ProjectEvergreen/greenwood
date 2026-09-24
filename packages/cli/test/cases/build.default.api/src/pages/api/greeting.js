// this is unprefixed to test automatic node: prefixing for builtins
// eslint-disable-next-line import/enforce-node-protocol-usage
import assert from "assert/strict";
import FormData from "form-data";

// tests that API routes don't execute at build time
// https://github.com/ProjectEvergreen/greenwood/issues/1690
assert(process.env.NODE_ENV);

export default function handler() {
  const form = new FormData();

  form.append("message", "Hello World");

  return new Response(form.getBuffer(), {
    headers: form.getHeaders(),
  });
}
