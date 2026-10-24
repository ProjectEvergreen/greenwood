// @ts-nocheck
/*
 * Vendored explicit-parent ESM resolver from import-meta-resolve 4.2.0.
 * https://github.com/wooorm/import-meta-resolve
 *
 * Extracted moduleResolve and its reachable helpers from lib/resolve.js,
 * lib/package-json-reader.js, lib/get-format.js, lib/utils.js, and lib/errors.js.
 * Upstream derives these from Node.js (resolve/utils: 81a9a97, package reader
 * and get_format: 7c3dce0, errors: 45f5c9b; last checked April 29, 2024).
 *
 * Local changes: combined the reachable code into one file; converted the error
 * registry to named bindings to remove unused errors; omitted unused public APIs
 * and type comments; added a resolve(specifier, parent) wrapper for file URL
 * parents with import.meta.resolve's missing-file/directory URL behavior.
 * Uses upstream's node/import conditions and realpath handling. It does not run
 * loader hooks or read runtime flags/import maps. Keep package-root lookup in
 * node-modules-utils.js: asset roots do not require resolving an ESM entry point.
 *
 * License notices from upstream follow in full.
 *
 * (The MIT License)
 *
 * Copyright (c) Titus Wormer <mailto:tituswormer@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ---
 *
 * This is a derivative work based on:
 * <https://github.com/nodejs/node>.
 * Which is licensed:
 *
 * """
 * Copyright Node.js contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * """
 *
 * This license applies to parts of Node.js originating from the
 * https://github.com/joyent/node repository:
 *
 * """
 * Copyright Joyent, Inc. and other Node contributors. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * """
 *
 */

// vendored from import-meta-resolve 4.2.0 as the second argument to import.meta.resolve(specifier, parent) is still experimental
// https://github.com/wooorm/import-meta-resolve/
// https://github.com/nodejs/node/issues/61127
// https://nodejs.org/docs/latest-v24.x/api/esm.html#importmetaresolvespecifier
import v8 from "node:v8";
import assert from "node:assert";
import { format } from "node:util";
import fs, { realpathSync, statSync } from "node:fs";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { builtinModules } from "node:module";

const own$1 = {}.hasOwnProperty;

const messages = new Map();
const nodeInternalPrefix = "__node_internal_";

let userStackTraceLimit;

const ERR_INVALID_MODULE_SPECIFIER = createError(
  "ERR_INVALID_MODULE_SPECIFIER",

  (request, reason, base = undefined) => {
    return `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ""}`;
  },
  TypeError,
);

const ERR_INVALID_PACKAGE_CONFIG = createError(
  "ERR_INVALID_PACKAGE_CONFIG",

  (path, base, message) => {
    return `Invalid package config ${path}${
      base ? ` while importing ${base}` : ""
    }${message ? `. ${message}` : ""}`;
  },
  Error,
);

const ERR_INVALID_PACKAGE_TARGET = createError(
  "ERR_INVALID_PACKAGE_TARGET",

  (packagePath, key, target, isImport = false, base = undefined) => {
    const relatedError =
      typeof target === "string" && !isImport && target.length > 0 && !target.startsWith("./");
    if (key === ".") {
      assert.ok(isImport === false);
      return (
        `Invalid "exports" main target ${JSON.stringify(target)} defined ` +
        `in the package config ${packagePath}package.json${
          base ? ` imported from ${base}` : ""
        }${relatedError ? '; targets must start with "./"' : ""}`
      );
    }

    return `Invalid "${isImport ? "imports" : "exports"}" target ${JSON.stringify(
      target,
    )} defined for '${key}' in the package config ${packagePath}package.json${
      base ? ` imported from ${base}` : ""
    }${relatedError ? '; targets must start with "./"' : ""}`;
  },
  Error,
);

const ERR_MODULE_NOT_FOUND = createError(
  "ERR_MODULE_NOT_FOUND",

  (path, base, exactUrl = false) => {
    return `Cannot find ${exactUrl ? "module" : "package"} '${path}' imported from ${base}`;
  },
  Error,
);

const ERR_PACKAGE_IMPORT_NOT_DEFINED = createError(
  "ERR_PACKAGE_IMPORT_NOT_DEFINED",

  (specifier, packagePath, base) => {
    return `Package import specifier "${specifier}" is not defined${
      packagePath ? ` in package ${packagePath}package.json` : ""
    } imported from ${base}`;
  },
  TypeError,
);

const ERR_PACKAGE_PATH_NOT_EXPORTED = createError(
  "ERR_PACKAGE_PATH_NOT_EXPORTED",

  (packagePath, subpath, base = undefined) => {
    if (subpath === ".")
      return `No "exports" main defined in ${packagePath}package.json${
        base ? ` imported from ${base}` : ""
      }`;
    return `Package subpath '${subpath}' is not defined by "exports" in ${packagePath}package.json${
      base ? ` imported from ${base}` : ""
    }`;
  },
  Error,
);

const ERR_UNSUPPORTED_DIR_IMPORT = createError(
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "Directory import '%s' is not supported " + "resolving ES modules imported from %s",
  Error,
);

const ERR_UNSUPPORTED_RESOLVE_REQUEST = createError(
  "ERR_UNSUPPORTED_RESOLVE_REQUEST",
  'Failed to resolve module specifier "%s" from "%s": Invalid relative URL or base scheme is not hierarchical.',
  TypeError,
);

const ERR_UNKNOWN_FILE_EXTENSION = createError(
  "ERR_UNKNOWN_FILE_EXTENSION",

  (extension, path) => {
    return `Unknown file extension "${extension}" for ${path}`;
  },
  TypeError,
);

function createError(sym, value, constructor) {
  messages.set(sym, value);

  return makeNodeErrorWithCode(constructor, sym);
}

function makeNodeErrorWithCode(Base, key) {
  return NodeError;

  function NodeError(...parameters) {
    const limit = Error.stackTraceLimit;
    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
    const error = new Base();

    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
    const message = getMessage(key, parameters, error);
    Object.defineProperties(error, {
      message: {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true,
      },
      toString: {
        value() {
          return `${this.name} [${key}]: ${this.message}`;
        },
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });

    captureLargerStackTrace(error);

    error.code = key;
    return error;
  }
}

function isErrorStackTraceLimitWritable() {
  try {
    if (v8.startupSnapshot.isBuildingSnapshot()) {
      return false;
    }
  } catch {
    // Other runtimes may not expose Node's startup snapshot API.
  }

  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === undefined) {
    return Object.isExtensible(Error);
  }

  return own$1.call(desc, "writable") && desc.writable !== undefined
    ? desc.writable
    : desc.set !== undefined;
}

function hideStackFrames(wrappedFunction) {
  const hidden = nodeInternalPrefix + wrappedFunction.name;
  Object.defineProperty(wrappedFunction, "name", { value: hidden });
  return wrappedFunction;
}

const captureLargerStackTrace = hideStackFrames(function (error) {
  const stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
  if (stackTraceLimitIsWritable) {
    userStackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = Number.POSITIVE_INFINITY;
  }

  Error.captureStackTrace(error);

  if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;

  return error;
});

function getMessage(key, parameters, self) {
  const message = messages.get(key);
  assert.ok(message !== undefined, "expected `message` to be found");

  if (typeof message === "function") {
    assert.ok(
      message.length <= parameters.length,
      `Code: ${key}; The provided arguments length (${parameters.length}) does not ` +
        `match the required ones (${message.length}).`,
    );
    return Reflect.apply(message, self, parameters);
  }

  const regex = /%[dfijoOs]/g;
  let expectedLength = 0;
  while (regex.exec(message) !== null) expectedLength++;
  assert.ok(
    expectedLength === parameters.length,
    `Code: ${key}; The provided arguments length (${parameters.length}) does not ` +
      `match the required ones (${expectedLength}).`,
  );
  if (parameters.length === 0) return message;

  parameters.unshift(message);
  return Reflect.apply(format, null, parameters);
}

const hasOwnProperty$1 = {}.hasOwnProperty;

const cache = new Map();

function read(jsonPath, { base, specifier }) {
  const existing = cache.get(jsonPath);

  if (existing) {
    return existing;
  }

  let string;

  try {
    string = fs.readFileSync(path.toNamespacedPath(jsonPath), "utf8");
  } catch (error) {
    const exception = error;

    if (exception.code !== "ENOENT") {
      throw exception;
    }
  }

  const result = {
    exists: false,
    pjsonPath: jsonPath,
    main: undefined,
    name: undefined,
    type: "none",
    exports: undefined,
    imports: undefined,
  };

  if (string !== undefined) {
    let parsed;

    try {
      parsed = JSON.parse(string);
    } catch (error_) {
      const cause = error_;
      const error = new ERR_INVALID_PACKAGE_CONFIG(
        jsonPath,
        (base ? `"${specifier}" from ` : "") + fileURLToPath(base || specifier),
        cause.message,
      );
      error.cause = cause;
      throw error;
    }

    result.exists = true;

    if (hasOwnProperty$1.call(parsed, "name") && typeof parsed.name === "string") {
      result.name = parsed.name;
    }

    if (hasOwnProperty$1.call(parsed, "main") && typeof parsed.main === "string") {
      result.main = parsed.main;
    }

    if (hasOwnProperty$1.call(parsed, "exports")) {
      result.exports = parsed.exports;
    }

    if (hasOwnProperty$1.call(parsed, "imports")) {
      result.imports = parsed.imports;
    }

    if (
      hasOwnProperty$1.call(parsed, "type") &&
      (parsed.type === "commonjs" || parsed.type === "module")
    ) {
      result.type = parsed.type;
    }
  }

  cache.set(jsonPath, result);

  return result;
}

function getPackageScopeConfig(resolved) {
  let packageJSONUrl = new URL("package.json", resolved);

  while (true) {
    const packageJSONPath = packageJSONUrl.pathname;
    if (packageJSONPath.endsWith("node_modules/package.json")) {
      break;
    }

    const packageConfig = read(fileURLToPath(packageJSONUrl), {
      specifier: resolved,
    });

    if (packageConfig.exists) {
      return packageConfig;
    }

    const lastPackageJSONUrl = packageJSONUrl;
    packageJSONUrl = new URL("../package.json", packageJSONUrl);

    if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
      break;
    }
  }

  const packageJSONPath = fileURLToPath(packageJSONUrl);

  return {
    pjsonPath: packageJSONPath,
    exists: false,
    type: "none",
  };
}

function getPackageType(url) {
  return getPackageScopeConfig(url).type;
}

const hasOwnProperty = {}.hasOwnProperty;

const extensionFormatMap = {
  __proto__: null,
  ".cjs": "commonjs",
  ".js": "module",
  ".json": "json",
  ".mjs": "module",
};

function mimeToFormat(mime) {
  if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime))
    return "module";
  if (mime === "application/json") return "json";
  return null;
}

const protocolHandlers = {
  __proto__: null,
  "data:": getDataProtocolModuleFormat,
  "file:": getFileProtocolModuleFormat,
  "http:": getHttpProtocolModuleFormat,
  "https:": getHttpProtocolModuleFormat,
  "node:"() {
    return "builtin";
  },
};

function getDataProtocolModuleFormat(parsed) {
  const { 1: mime } = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(parsed.pathname) || [
    null,
    null,
    null,
  ];
  return mimeToFormat(mime);
}

function extname(url) {
  const pathname = url.pathname;
  let index = pathname.length;

  while (index--) {
    const code = pathname.codePointAt(index);

    if (code === 47) {
      return "";
    }

    if (code === 46) {
      return pathname.codePointAt(index - 1) === 47 ? "" : pathname.slice(index);
    }
  }

  return "";
}

function getFileProtocolModuleFormat(url, _context, ignoreErrors) {
  const value = extname(url);

  if (value === ".js") {
    const packageType = getPackageType(url);

    if (packageType !== "none") {
      return packageType;
    }

    return "commonjs";
  }

  if (value === "") {
    const packageType = getPackageType(url);

    if (packageType === "none" || packageType === "commonjs") {
      return "commonjs";
    }

    return "module";
  }

  const format = extensionFormatMap[value];
  if (format) return format;

  if (ignoreErrors) {
    return undefined;
  }

  const filepath = fileURLToPath(url);
  throw new ERR_UNKNOWN_FILE_EXTENSION(value, filepath);
}

function getHttpProtocolModuleFormat() {}

function defaultGetFormatWithoutErrors(url, context) {
  const protocol = url.protocol;

  if (!hasOwnProperty.call(protocolHandlers, protocol)) {
    return null;
  }

  return protocolHandlers[protocol](url, context, true) || null;
}

const DEFAULT_CONDITIONS = new Set(["node", "import"]);

const RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];

const own = {}.hasOwnProperty;

const invalidSegmentRegEx =
  /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
const deprecatedInvalidSegmentRegEx =
  /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
const invalidPackageNameRegEx = /^\.|%|\\/;
const patternRegEx = /\*/g;
const encodedSeparatorRegEx = /%2f|%5c/i;

const emittedPackageWarnings = new Set();

const doubleSlashRegEx = /[/\\]{2}/;

function emitInvalidSegmentDeprecation(
  target,
  request,
  match,
  packageJsonUrl,
  internal,
  base,
  isTarget,
) {
  if (process.noDeprecation) {
    return;
  }

  const pjsonPath = fileURLToPath(packageJsonUrl);
  const double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
  process.emitWarning(
    `Use of deprecated ${
      double ? "double slash" : "leading or trailing slash matching"
    } resolving "${target}" for module ` +
      `request "${request}" ${request === match ? "" : `matched to "${match}" `}in the "${
        internal ? "imports" : "exports"
      }" field module resolution of the package at ${pjsonPath}${
        base ? ` imported from ${fileURLToPath(base)}` : ""
      }.`,
    "DeprecationWarning",
    "DEP0166",
  );
}

function emitLegacyIndexDeprecation(url, packageJsonUrl, base, main) {
  if (process.noDeprecation) {
    return;
  }

  const format = defaultGetFormatWithoutErrors(url, { parentURL: base.href });
  if (format !== "module") return;
  const urlPath = fileURLToPath(url.href);
  const packagePath = fileURLToPath(new URL(".", packageJsonUrl));
  const basePath = fileURLToPath(base);
  if (!main) {
    process.emitWarning(
      `No "main" or "exports" field defined in the package.json for ${packagePath} resolving the main entry point "${urlPath.slice(
        packagePath.length,
      )}", imported from ${basePath}.\nDefault "index" lookups for the main are deprecated for ES modules.`,
      "DeprecationWarning",
      "DEP0151",
    );
  } else if (path.resolve(packagePath, main) !== urlPath) {
    process.emitWarning(
      `Package ${packagePath} has a "main" field set to "${main}", ` +
        `excluding the full filename and extension to the resolved file at "${urlPath.slice(
          packagePath.length,
        )}", imported from ${basePath}.\n Automatic extension resolution of the "main" field is ` +
        "deprecated for ES modules.",
      "DeprecationWarning",
      "DEP0151",
    );
  }
}

function tryStatSync(path) {
  try {
    return statSync(path);
  } catch {
    // Resolution reports paths that could not be read as missing.
  }
}

function fileExists(url) {
  const stats = statSync(url, { throwIfNoEntry: false });
  const isFile = stats ? stats.isFile() : undefined;
  return isFile === null || isFile === undefined ? false : isFile;
}

function legacyMainResolve(packageJsonUrl, packageConfig, base) {
  let guess;
  if (packageConfig.main !== undefined) {
    guess = new URL(packageConfig.main, packageJsonUrl);

    if (fileExists(guess)) return guess;

    const tries = [
      `./${packageConfig.main}.js`,
      `./${packageConfig.main}.json`,
      `./${packageConfig.main}.node`,
      `./${packageConfig.main}/index.js`,
      `./${packageConfig.main}/index.json`,
      `./${packageConfig.main}/index.node`,
    ];
    let i = -1;

    while (++i < tries.length) {
      guess = new URL(tries[i], packageJsonUrl);
      if (fileExists(guess)) break;
      guess = undefined;
    }

    if (guess) {
      emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
      return guess;
    }
  }

  const tries = ["./index.js", "./index.json", "./index.node"];
  let i = -1;

  while (++i < tries.length) {
    guess = new URL(tries[i], packageJsonUrl);
    if (fileExists(guess)) break;
    guess = undefined;
  }

  if (guess) {
    emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
    return guess;
  }

  throw new ERR_MODULE_NOT_FOUND(fileURLToPath(new URL(".", packageJsonUrl)), fileURLToPath(base));
}

function finalizeResolution(resolved, base) {
  if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      resolved.pathname,
      'must not include encoded "/" or "\\" characters',
      fileURLToPath(base),
    );
  }

  let filePath;

  try {
    filePath = fileURLToPath(resolved);
  } catch (error) {
    const cause = error;
    Object.defineProperty(cause, "input", { value: String(resolved) });
    Object.defineProperty(cause, "module", { value: String(base) });
    throw cause;
  }

  const stats = tryStatSync(filePath.endsWith("/") ? filePath.slice(-1) : filePath);

  if (stats && stats.isDirectory()) {
    const error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, fileURLToPath(base));

    error.url = String(resolved);
    throw error;
  }

  if (!stats || !stats.isFile()) {
    const error = new ERR_MODULE_NOT_FOUND(
      filePath || resolved.pathname,
      base && fileURLToPath(base),
      true,
    );

    error.url = String(resolved);
    throw error;
  }

  {
    const real = realpathSync(filePath);
    const { search, hash } = resolved;
    resolved = pathToFileURL(real + (filePath.endsWith(path.sep) ? "/" : ""));
    resolved.search = search;
    resolved.hash = hash;
  }

  return resolved;
}

function importNotDefined(specifier, packageJsonUrl, base) {
  return new ERR_PACKAGE_IMPORT_NOT_DEFINED(
    specifier,
    packageJsonUrl && fileURLToPath(new URL(".", packageJsonUrl)),
    fileURLToPath(base),
  );
}

function exportsNotFound(subpath, packageJsonUrl, base) {
  return new ERR_PACKAGE_PATH_NOT_EXPORTED(
    fileURLToPath(new URL(".", packageJsonUrl)),
    subpath,
    base && fileURLToPath(base),
  );
}

function throwInvalidSubpath(request, match, packageJsonUrl, internal, base) {
  const reason = `request is not a valid match in pattern "${match}" for the "${
    internal ? "imports" : "exports"
  }" resolution of ${fileURLToPath(packageJsonUrl)}`;
  throw new ERR_INVALID_MODULE_SPECIFIER(request, reason, base && fileURLToPath(base));
}

function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
  target =
    typeof target === "object" && target !== null ? JSON.stringify(target, null, "") : `${target}`;

  return new ERR_INVALID_PACKAGE_TARGET(
    fileURLToPath(new URL(".", packageJsonUrl)),
    subpath,
    target,
    internal,
    base && fileURLToPath(base),
  );
}

function resolvePackageTargetString(
  target,
  subpath,
  match,
  packageJsonUrl,
  base,
  pattern,
  internal,
  isPathMap,
  conditions,
) {
  if (subpath !== "" && !pattern && target[target.length - 1] !== "/")
    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);

  if (!target.startsWith("./")) {
    if (internal && !target.startsWith("../") && !target.startsWith("/")) {
      let isURL = false;

      try {
        new URL(target);
        isURL = true;
      } catch {
        // A bare imports target may name another package.
      }

      if (!isURL) {
        const exportTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath)
          : target + subpath;

        return packageResolve(exportTarget, packageJsonUrl, conditions);
      }
    }

    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
  }

  if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
    if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
      if (!isPathMap) {
        const request = pattern ? match.replace("*", () => subpath) : match + subpath;
        const resolvedTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath)
          : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match,
          packageJsonUrl,
          internal,
          base,
          true,
        );
      }
    } else {
      throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    }
  }

  const resolved = new URL(target, packageJsonUrl);
  const resolvedPath = resolved.pathname;
  const packagePath = new URL(".", packageJsonUrl).pathname;

  if (!resolvedPath.startsWith(packagePath))
    throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);

  if (subpath === "") return resolved;

  if (invalidSegmentRegEx.exec(subpath) !== null) {
    const request = pattern ? match.replace("*", () => subpath) : match + subpath;
    if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
      if (!isPathMap) {
        const resolvedTarget = pattern
          ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, () => subpath)
          : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match,
          packageJsonUrl,
          internal,
          base,
          false,
        );
      }
    } else {
      throwInvalidSubpath(request, match, packageJsonUrl, internal, base);
    }
  }

  if (pattern) {
    return new URL(RegExpPrototypeSymbolReplace.call(patternRegEx, resolved.href, () => subpath));
  }

  return new URL(subpath, resolved);
}

function isArrayIndex(key) {
  const keyNumber = Number(key);
  if (`${keyNumber}` !== key) return false;
  return keyNumber >= 0 && keyNumber < 0xff_ff_ff_ff;
}

function resolvePackageTarget(
  packageJsonUrl,
  target,
  subpath,
  packageSubpath,
  base,
  pattern,
  internal,
  isPathMap,
  conditions,
) {
  if (typeof target === "string") {
    return resolvePackageTargetString(
      target,
      subpath,
      packageSubpath,
      packageJsonUrl,
      base,
      pattern,
      internal,
      isPathMap,
      conditions,
    );
  }

  if (Array.isArray(target)) {
    const targetList = target;
    if (targetList.length === 0) return null;

    let lastException;
    let i = -1;

    while (++i < targetList.length) {
      const targetItem = targetList[i];

      let resolveResult;
      try {
        resolveResult = resolvePackageTarget(
          packageJsonUrl,
          targetItem,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions,
        );
      } catch (error) {
        const exception = error;
        lastException = exception;
        if (exception.code === "ERR_INVALID_PACKAGE_TARGET") continue;
        throw error;
      }

      if (resolveResult === undefined) continue;

      if (resolveResult === null) {
        lastException = null;
        continue;
      }

      return resolveResult;
    }

    if (lastException === undefined || lastException === null) {
      return null;
    }

    throw lastException;
  }

  if (typeof target === "object" && target !== null) {
    const keys = Object.getOwnPropertyNames(target);
    let i = -1;

    while (++i < keys.length) {
      const key = keys[i];
      if (isArrayIndex(key)) {
        throw new ERR_INVALID_PACKAGE_CONFIG(
          fileURLToPath(packageJsonUrl),
          base,
          '"exports" cannot contain numeric property keys.',
        );
      }
    }

    i = -1;

    while (++i < keys.length) {
      const key = keys[i];
      if (key === "default" || (conditions && conditions.has(key))) {
        const conditionalTarget = target[key];
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          conditionalTarget,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions,
        );
        if (resolveResult === undefined) continue;
        return resolveResult;
      }
    }

    return null;
  }

  if (target === null) {
    return null;
  }

  throw invalidPackageTarget(packageSubpath, target, packageJsonUrl, internal, base);
}

function isConditionalExportsMainSugar(exports, packageJsonUrl, base) {
  if (typeof exports === "string" || Array.isArray(exports)) return true;
  if (typeof exports !== "object" || exports === null) return false;

  const keys = Object.getOwnPropertyNames(exports);
  let isConditionalSugar = false;
  let i = 0;
  let keyIndex = -1;
  while (++keyIndex < keys.length) {
    const key = keys[keyIndex];
    const currentIsConditionalSugar = key === "" || key[0] !== ".";
    if (i++ === 0) {
      isConditionalSugar = currentIsConditionalSugar;
    } else if (isConditionalSugar !== currentIsConditionalSugar) {
      throw new ERR_INVALID_PACKAGE_CONFIG(
        fileURLToPath(packageJsonUrl),
        base,
        "\"exports\" cannot contain some keys starting with '.' and some not." +
          " The exports object must either be an object of package subpath keys" +
          " or an object of main entry condition name keys only.",
      );
    }
  }

  return isConditionalSugar;
}

function emitTrailingSlashPatternDeprecation(match, pjsonUrl, base) {
  if (process.noDeprecation) {
    return;
  }

  const pjsonPath = fileURLToPath(pjsonUrl);
  if (emittedPackageWarnings.has(pjsonPath + "|" + match)) return;
  emittedPackageWarnings.add(pjsonPath + "|" + match);
  process.emitWarning(
    `Use of deprecated trailing slash pattern mapping "${match}" in the ` +
      `"exports" field module resolution of the package at ${pjsonPath}${
        base ? ` imported from ${fileURLToPath(base)}` : ""
      }. Mapping specifiers ending in "/" is no longer supported.`,
    "DeprecationWarning",
    "DEP0155",
  );
}

function packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions) {
  let exports = packageConfig.exports;

  if (isConditionalExportsMainSugar(exports, packageJsonUrl, base)) {
    exports = { ".": exports };
  }

  if (
    own.call(exports, packageSubpath) &&
    !packageSubpath.includes("*") &&
    !packageSubpath.endsWith("/")
  ) {
    const target = exports[packageSubpath];
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      "",
      packageSubpath,
      base,
      false,
      false,
      false,
      conditions,
    );
    if (resolveResult === null || resolveResult === undefined) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base);
    }

    return resolveResult;
  }

  let bestMatch = "";
  let bestMatchSubpath = "";
  const keys = Object.getOwnPropertyNames(exports);
  let i = -1;

  while (++i < keys.length) {
    const key = keys[i];
    const patternIndex = key.indexOf("*");

    if (patternIndex !== -1 && packageSubpath.startsWith(key.slice(0, patternIndex))) {
      if (packageSubpath.endsWith("/")) {
        emitTrailingSlashPatternDeprecation(packageSubpath, packageJsonUrl, base);
      }

      const patternTrailer = key.slice(patternIndex + 1);

      if (
        packageSubpath.length >= key.length &&
        packageSubpath.endsWith(patternTrailer) &&
        patternKeyCompare(bestMatch, key) === 1 &&
        key.lastIndexOf("*") === patternIndex
      ) {
        bestMatch = key;
        bestMatchSubpath = packageSubpath.slice(
          patternIndex,
          packageSubpath.length - patternTrailer.length,
        );
      }
    }
  }

  if (bestMatch) {
    const target = exports[bestMatch];
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      bestMatchSubpath,
      bestMatch,
      base,
      true,
      false,
      packageSubpath.endsWith("/"),
      conditions,
    );

    if (resolveResult === null || resolveResult === undefined) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base);
    }

    return resolveResult;
  }

  throw exportsNotFound(packageSubpath, packageJsonUrl, base);
}

function patternKeyCompare(a, b) {
  const aPatternIndex = a.indexOf("*");
  const bPatternIndex = b.indexOf("*");
  const baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
  const baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
  if (baseLengthA > baseLengthB) return -1;
  if (baseLengthB > baseLengthA) return 1;
  if (aPatternIndex === -1) return 1;
  if (bPatternIndex === -1) return -1;
  if (a.length > b.length) return -1;
  if (b.length > a.length) return 1;
  return 0;
}

function packageImportsResolve(name, base, conditions) {
  if (name === "#" || name.startsWith("#/") || name.endsWith("/")) {
    const reason = "is not a valid internal imports specifier name";
    throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath(base));
  }

  let packageJsonUrl;

  const packageConfig = getPackageScopeConfig(base);

  if (packageConfig.exists) {
    packageJsonUrl = pathToFileURL(packageConfig.pjsonPath);
    const imports = packageConfig.imports;
    if (imports) {
      if (own.call(imports, name) && !name.includes("*")) {
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          imports[name],
          "",
          name,
          base,
          false,
          true,
          false,
          conditions,
        );
        if (resolveResult !== null && resolveResult !== undefined) {
          return resolveResult;
        }
      } else {
        let bestMatch = "";
        let bestMatchSubpath = "";
        const keys = Object.getOwnPropertyNames(imports);
        let i = -1;

        while (++i < keys.length) {
          const key = keys[i];
          const patternIndex = key.indexOf("*");

          if (patternIndex !== -1 && name.startsWith(key.slice(0, -1))) {
            const patternTrailer = key.slice(patternIndex + 1);
            if (
              name.length >= key.length &&
              name.endsWith(patternTrailer) &&
              patternKeyCompare(bestMatch, key) === 1 &&
              key.lastIndexOf("*") === patternIndex
            ) {
              bestMatch = key;
              bestMatchSubpath = name.slice(patternIndex, name.length - patternTrailer.length);
            }
          }
        }

        if (bestMatch) {
          const target = imports[bestMatch];
          const resolveResult = resolvePackageTarget(
            packageJsonUrl,
            target,
            bestMatchSubpath,
            bestMatch,
            base,
            true,
            true,
            false,
            conditions,
          );

          if (resolveResult !== null && resolveResult !== undefined) {
            return resolveResult;
          }
        }
      }
    }
  }

  throw importNotDefined(name, packageJsonUrl, base);
}

function parsePackageName(specifier, base) {
  let separatorIndex = specifier.indexOf("/");
  let validPackageName = true;
  let isScoped = false;
  if (specifier[0] === "@") {
    isScoped = true;
    if (separatorIndex === -1 || specifier.length === 0) {
      validPackageName = false;
    } else {
      separatorIndex = specifier.indexOf("/", separatorIndex + 1);
    }
  }

  const packageName = separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);

  if (invalidPackageNameRegEx.exec(packageName) !== null) {
    validPackageName = false;
  }

  if (!validPackageName) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      specifier,
      "is not a valid package name",
      fileURLToPath(base),
    );
  }

  const packageSubpath = "." + (separatorIndex === -1 ? "" : specifier.slice(separatorIndex));

  return { packageName, packageSubpath, isScoped };
}

function packageResolve(specifier, base, conditions) {
  if (builtinModules.includes(specifier)) {
    return new URL("node:" + specifier);
  }

  const { packageName, packageSubpath, isScoped } = parsePackageName(specifier, base);

  const packageConfig = getPackageScopeConfig(base);

  if (packageConfig.exists) {
    const packageJsonUrl = pathToFileURL(packageConfig.pjsonPath);
    if (
      packageConfig.name === packageName &&
      packageConfig.exports !== undefined &&
      packageConfig.exports !== null
    ) {
      return packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions);
    }
  }

  let packageJsonUrl = new URL("./node_modules/" + packageName + "/package.json", base);
  let packageJsonPath = fileURLToPath(packageJsonUrl);

  let lastPath;
  do {
    const stat = tryStatSync(packageJsonPath.slice(0, -13));
    if (!stat || !stat.isDirectory()) {
      lastPath = packageJsonPath;
      packageJsonUrl = new URL(
        (isScoped ? "../../../../node_modules/" : "../../../node_modules/") +
          packageName +
          "/package.json",
        packageJsonUrl,
      );
      packageJsonPath = fileURLToPath(packageJsonUrl);
      continue;
    }

    const packageConfig = read(packageJsonPath, { base, specifier });
    if (packageConfig.exports !== undefined && packageConfig.exports !== null) {
      return packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions);
    }

    if (packageSubpath === ".") {
      return legacyMainResolve(packageJsonUrl, packageConfig, base);
    }

    return new URL(packageSubpath, packageJsonUrl);
  } while (packageJsonPath.length !== lastPath.length);

  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), false);
}

function isRelativeSpecifier(specifier) {
  if (specifier[0] === ".") {
    if (specifier.length === 1 || specifier[1] === "/") return true;
    if (specifier[1] === "." && (specifier.length === 2 || specifier[2] === "/")) {
      return true;
    }
  }

  return false;
}

function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
  if (specifier === "") return false;
  if (specifier[0] === "/") return true;
  return isRelativeSpecifier(specifier);
}

function moduleResolve(specifier, base, conditions = DEFAULT_CONDITIONS) {
  const protocol = base.protocol;
  const isData = protocol === "data:";
  const isRemote = isData || protocol === "http:" || protocol === "https:";

  let resolved;

  if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
    try {
      resolved = new URL(specifier, base);
    } catch (error_) {
      const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
      error.cause = error_;
      throw error;
    }
  } else if (protocol === "file:" && specifier[0] === "#") {
    resolved = packageImportsResolve(specifier, base, conditions);
  } else {
    try {
      resolved = new URL(specifier);
    } catch (error_) {
      if (isRemote && !builtinModules.includes(specifier)) {
        const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
        error.cause = error_;
        throw error;
      }

      resolved = packageResolve(specifier, base, conditions);
    }
  }

  assert.ok(resolved !== undefined, "expected to be defined");

  if (resolved.protocol !== "file:") {
    return resolved;
  }

  return finalizeResolution(resolved, base);
}

function resolve(specifier, parent) {
  const base = new URL(parent);
  if (base.protocol !== "file:")
    throw new TypeError("Expected a file URL as the module resolution parent");
  try {
    return moduleResolve(specifier, base).href;
  } catch (error) {
    if (
      (error.code === "ERR_UNSUPPORTED_DIR_IMPORT" || error.code === "ERR_MODULE_NOT_FOUND") &&
      typeof error.url === "string"
    )
      return error.url;
    throw error;
  }
}

export { resolve };
