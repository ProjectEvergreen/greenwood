const fs = require('fs-extra');
const path = require('path');

const copySerialized404 = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const serialized404 = path.join(publicDir, '404', 'index.html');
      const target404Dir = path.join(publicDir, '404.html');

      if (await fs.exists(serialized404)) {
        await fs.copyFile(serialized404, target404Dir);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = postSerialize = async () => {
  return new Promise(async (resolve, reject) => {
    try {

      /// Post serialize tasks

      // Copy serialized 404 component to 404.html
      await copySerialized404();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};