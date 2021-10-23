// THIS SCRIPT SHOULD ONLY USE NATIVE NODE.JS APIs, NO PACKAGES FROM NPM ALLOWED
const fs = require('fs');
const path = require('path');

// https://stackoverflow.com/a/26038979
function copyFileSync(source, target) {
  let targetFile = target;

  // if target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  let files = [];

  // check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source));
  
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach((file) => {
      var curSource = path.join(source, file);

      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

module.exports = copyFolder = copyFolderRecursiveSync;