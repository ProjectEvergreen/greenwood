
/*
 * 
 * This script assumes access credentials are in place and a build has already been made and is in _./public_
 * 
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const glob = require('glob');
const yargs = require('yargs').argv;

// AWS CONFIGURATIONS
const AWS_REGION = 'us-east-1';
const AWS_S3_BUCKET = {
  PROD: 'TODO',
  STAGE: 'greenwood-dev'
};

// used to determine whether to deploy to prod or stage
// PROD is set using a manual release process, so STAGE is default
const RELEASE_ENVIRONMENT = yargs.release_env === 'prod' ? 'PROD' : 'STAGE';

console.log(`Releasing to => ${RELEASE_ENVIRONMENT }`); // eslint-disable-line no-console

AWS.config.region = AWS_REGION;

// helpful for simple debugging
// s3.listBuckets(function(err, data) {
//   if (err) {
//     console.log("Error:", err);
//   } else {
//     for (var index in data.Buckets) {
//       let bucket = data.Buckets[index];
//       console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
//     }
//   }
// });

// uploads the build directory to S3, our "main method"
glob('./public/**/**', function (er, files) {
  for (let i = 0, l = files.length; i < l; i += 1) {
    const filename = files[i];
    const s3Filename = filename.replace('./public/', '');

    // upload only files
    if (s3Filename.indexOf('.') > 0) {
      const extension = filename.slice(filename.lastIndexOf('.'));
      const contentType = getContentType(extension);
      const body = fs.readFileSync(filename); // .pipe(zlib.createGzip());

      const s3 = new AWS.S3({
        params: {
          Bucket: AWS_S3_BUCKET[RELEASE_ENVIRONMENT],
          Key: s3Filename,
          ContentType: contentType,
          ACL: 'public-read'
        }
      });

      s3.upload({ Body: body }).on('httpUploadProgress', httpUploadProgress).send(httpUploadSend);
    }
  }
});

// mainly here so there's something fun to see in the jenkins build 
function httpUploadProgress(evt) {
  console.log(evt); // eslint-disable-line no-console
}

// watches for index.html upload and triggers a cache bust in cloudfront
function httpUploadSend(err, data) {
  console.log(err, data); // eslint-disable-line no-console
  // trigger an invalidation to cache bust the site on each release
}

// appropriately set objects content-type when uploading build to S3
function getContentType(extension) {
  let contentType = '';

  switch (extension) {

    case '.eot':
      contentType = 'application/vnd.ms-fontobject';
      break;
    case '.jpg':
      contentType = 'image/jpeg';
      break;
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.otf':
      contentType = 'application/x-font-opentype';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ttf':
      contentType = 'application/x-font-ttf';
      break;
    case '.woff':
      contentType = 'application/font-woff';
      break;
    case '.woff2':
      contentType = 'application/font-woff2';
      break;
    default:
      contentType = 'text/' + extension.replace('.', '');
      break;

  }

  return contentType;
}