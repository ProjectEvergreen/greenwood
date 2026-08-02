/*
 * Emulates the destination file locking behavior of copyFile on Windows, where a copy
 * to a destination that already has another copy in flight fails with EBUSY.  Loaded
 * into the CLI process via NODE_OPTIONS --import by the accompanying spec, so the
 * intermittent Windows-only CI failure can be reproduced deterministically on any OS.
 * https://github.com/ProjectEvergreen/greenwood/issues/1585
 */
import fs from "node:fs";

const originalCopyFile = fs.promises.copyFile;
const inFlightDestinations = new Set();

fs.promises.copyFile = function copyFile(src, dest, ...args) {
  const key = dest.toString();

  if (inFlightDestinations.has(key)) {
    const error = new Error(`EBUSY: resource busy or locked, copyfile '${src}' -> '${dest}'`);

    error.code = "EBUSY";
    error.errno = -4082;
    error.syscall = "copyfile";

    return Promise.reject(error);
  }

  inFlightDestinations.add(key);

  return originalCopyFile.call(fs.promises, src, dest, ...args).finally(() => {
    inFlightDestinations.delete(key);
  });
};
