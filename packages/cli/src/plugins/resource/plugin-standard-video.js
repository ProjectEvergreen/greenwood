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

    // https://help.encoding.com/knowledge-base/article/correct-mime-types-for-serving-video-files/
    this.extensions = ['flv', 'mp4', 'm3u8', 'ts', '3gp', 'mov', 'avi', 'wmv'];
  }

  async shouldServe(url) {
    return url.protocol === 'file:' && this.extensions.includes(url.pathname.split('.').pop());
  }

  async serve(url) {
    const extension = url.pathname.split('.').pop();
    const body = await fs.readFile(url);
    let contentType = '';

    switch (extension) {

      case 'flv':
        contentType = 'video/x-flv';
        break;
      case 'mp4':
        contentType = 'video/mp4';
        break;
      case 'm3u8':
        contentType = 'application/x-mpegURL';
        break;
      case 'ts':
        contentType = 'video/MP2T';
        break;
      case '3gp':
        contentType = 'video/3gpp';
        break;
      case 'mov':
        contentType = 'video/quicktime';
        break;
      case 'avi':
        contentType = 'video/x-msvideo';
        break;
      case 'wmv':
        contentType = 'video/x-ms-wmv';
        break;
      default:

    }

    return new Response(body, {
      headers: new Headers({
        'Content-Type': contentType
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