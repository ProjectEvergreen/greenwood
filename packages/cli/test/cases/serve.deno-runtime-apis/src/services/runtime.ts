/// <reference lib="deno.ns" />

export function getRuntimeInfo() {
  return {
    runtime: "deno",
    deno: Deno.version.deno,
    v8: Deno.version.v8,
    typescript: Deno.version.typescript,
    os: Deno.build.os,
    arch: Deno.build.arch,
  };
}
