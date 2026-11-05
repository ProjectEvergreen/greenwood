import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import TOML from "@iarna/toml";
import { parse, printParseErrorCode } from "jsonc-parser";

async function readWranglerConfig(projectDirectory) {
  // Match Wrangler's preference when more than one config format is present.
  for (const filename of ["wrangler.json", "wrangler.jsonc", "wrangler.toml"]) {
    const configUrl = new URL(filename, projectDirectory);
    let source;

    try {
      source = await fs.readFile(configUrl, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    try {
      let config;
      if (filename.endsWith(".toml")) {
        config = TOML.parse(source);
      } else {
        const errors = [];
        config = parse(source, errors, { allowTrailingComma: true });
        if (errors.length > 0) {
          throw new Error(`${printParseErrorCode(errors[0].error)} at offset ${errors[0].offset}`);
        }
      }

      if (!config || typeof config !== "object" || Array.isArray(config)) {
        throw new TypeError("Configuration must be an object");
      }

      return config;
    } catch (error) {
      throw new Error(`Invalid Wrangler config ${fileURLToPath(configUrl)}: ${error.message}`, {
        cause: error,
      });
    }
  }

  return {};
}

async function resolveWranglerConfig(projectDirectory, options = {}) {
  const config = await readWranglerConfig(projectDirectory);
  const compatibilityDate = options.compatibilityDate ?? config.compatibility_date ?? "2026-10-03";
  const compatibilityFlags = options.compatibilityFlags ??
    config.compatibility_flags ?? ["new_module_registry"];
  const assetsBinding = options.assets?.binding ?? config.assets?.binding ?? "ASSETS";

  if (typeof compatibilityDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(compatibilityDate)) {
    throw new TypeError("Cloudflare adapter compatibilityDate must be a YYYY-MM-DD string");
  }
  if (
    !Array.isArray(compatibilityFlags) ||
    compatibilityFlags.some((flag) => typeof flag !== "string")
  ) {
    throw new TypeError("Cloudflare adapter compatibilityFlags must be an array of strings");
  }
  if (typeof assetsBinding !== "string" || assetsBinding.length === 0) {
    throw new TypeError("Cloudflare adapter assets.binding must be a nonempty string");
  }

  return { compatibilityDate, compatibilityFlags, assetsBinding };
}

export { resolveWranglerConfig };
