/*
 * 
 * Manages web standard resource related operations for video formats.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardVideoResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs
    // https://help.encoding.com/knowledge-base/article/correct-mime-types-for-serving-video-files/
    this.extensions = ['3gp', 'avi', 'flv', 'm3u8', 'mp4', 'mov', 'ogg', 'ogv', 'wmv'];
  }

  async shouldServe(url) {
    const extension = url.pathname.split('.').pop();

    return url.protocol === 'file:' && this.extensions.includes(extension);
  }

  async serve(url) {
    const extension = url.pathname.split('.').pop();
    const body = await fs.readFile(url);
    let contentType = '';

    switch (extension) {

      case '3gp':
        contentType = 'video/3gpp';
        break;
      case 'avi':
        contentType = 'video/x-msvideo';
        break;  
      case 'flv':
        contentType = 'video/x-flv';
        break;
      case 'm3u8':
        contentType = 'application/x-mpegURL';
        break;
      case 'mp4':
        contentType = 'video/mp4';
        break;
      case 'mov':
        contentType = 'video/quicktime';
        break;
      case 'ogg':
        contentType = `application/${extension}`;
        break;
      case 'ogv':
        contentType = `video/${extension}`;
        break;
      case 'wmv':
        contentType = 'video/x-ms-wmv';
        break;
      default:

    }

    return new Response(body, {
      headers: new Headers({
        'Content-Type': contentType,
        'Content-Length': String(body.toString().length)
      })
    });
  }
}

const greenwoodPluginStandardVideo = {
  type: 'resource',
  name: 'plugin-standard-video',
  provider: (compilation, options) => new StandardVideoResource(compilation, options)
};

export { greenwoodPluginStandardVideo };