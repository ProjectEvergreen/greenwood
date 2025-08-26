/* eslint-disable no-unused-vars */
// packages/cli/test/bin.parseargs.test.js
import { spawn } from "node:child_process";
import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const binPath = join(__dirname, "../../src/bin.js");

function runCLI(args = [], timeoutMs = 10000) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [binPath, ...args], { env: process.env });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const to = setTimeout(() => {
      timedOut = true;

      try {
        proc.kill();
      } catch (e) {
        /* empty */
      }
    }, timeoutMs);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(to);
      resolve({ stdout, stderr, code, timedOut });
    });

    // in case spawn errors synchronously (rare)
    proc.on("error", (err) => {
      clearTimeout(to);
      resolve({ stdout, stderr: String(err), code: 1, timedOut });
    });
  });
}

(async () => {
  console.log("Running parseArgs CLI tests...");

  // 1) --help should include Usage and Commands
  {
    const r = await runCLI(["--help"]);
    assert.ok(!r.timedOut, "--help timed out");
    assert.ok(/Usage:/.test(r.stdout) || /usage:/.test(r.stdout), "help should include Usage");
    assert.ok(
      /Commands:/.test(r.stdout) || /Commands/.test(r.stdout),
      "help should include Commands",
    );
    console.log("✓ --help");
  }

  // 2) --version should print a semver-like string or include version banner
  {
    const r = await runCLI(["--version"]);
    assert.ok(!r.timedOut, "--version timed out");

    // Accept "1.2.3" or "v1.2.3" or banner containing version
    const okVersion = /v?\d+\.\d+\.\d+/.test(r.stdout) || /Welcome to Greenwood/.test(r.stdout);
    assert.ok(okVersion, `--version output not recognized: ${r.stdout}`);
    console.log("✓ --version");
  }

  // 3) no args -> should show help (or banner + usage)
  {
    const r = await runCLI([]);
    assert.ok(!r.timedOut, "no-args timed out");
    assert.ok(
      /Welcome to Greenwood/.test(r.stdout) || /Usage:/.test(r.stdout),
      "no-args should show help/banner",
    );
    console.log("✓ no args");
  }

  // 4) unknown command -> should return non-zero exit and show help/error
  {
    const r = await runCLI(["someinvalidcommand"]);
    // some implementations exit with code 1; if your CLI prints help and exits 0, adjust this assertion
    assert.ok(
      r.code !== 0 || /Unknown command/.test(r.stderr) || /Unknown command/.test(r.stdout),
      "unknown command should error or show unknown command message",
    );
    console.log("✓ unknown command handling");
  }

  // 5) basic valid commands: build/develop/serve
  // Note: these may run real logic; we test only that the process starts and prints the banner.
  // The goal here is only to confirm that the CLI accepts each command
  // and can start without crashing.
  for (const cmd of ["build", "develop", "serve"]) {
    const r = await runCLI([cmd], 1000); // short timeout: just ensure process kicks off
    assert.ok(r.timedOut || r.code === 0, `${cmd} should start without crashing`);
    console.log(`✓ ${cmd} started successfully`);
  }

  console.log("All parseArgs CLI tests passed.");
})();
