/*
 * 
 * Manages web standard resource related operations for audio formats.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { isGenericMediaContainer } from '../../lib/resource-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardAudioResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_codecs
    // https://www.thoughtco.com/audio-file-mime-types-3469485
    // TODO add support for .ts
    this.extensions = ['3gp', 'mid', 'mp3', 'mp4', 'm3u', 'oga', 'ogg', 'ra', 'wav'];
  }

  async shouldServe(url, request) {
    const extension = url.pathname.split('.').pop();
    const isAudioFile = request.headers.get('Sec-Fetch-Dest') === 'audio';
    const isGenericAudioResource = isGenericMediaContainer(extension) && isAudioFile;

    return url.protocol === 'file:' && (isGenericAudioResource || (!isGenericMediaContainer(extension) && this.extensions.includes(extension)));
  }

  async serve(url) {
    const extension = url.pathname.split('.').pop();
    const body = await fs.readFile(url);
    let contentType = '';

    switch (extension) {

      case '3gp':
        contentType = 'audio/3gp';
        break;
      case 'mid':
        contentType = 'audio/mid';
        break;
      case 'mp3':
        contentType = 'audio/mpeg';
        break;
      case 'mp4':
        contentType = 'audio/mp4';
        break;
      case 'm3u':
        contentType = 'audio/x-mpegurl';
        break;
      case 'oga':
      case 'ogg':
        contentType = `audio/${extension}`;
        break;
      case 'ra':
        contentType = 'audio/vnd.rn-realaudio';
        break;
      case 'wav':
        contentType = 'audio/vnd.wav';
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

const greenwoodPluginStandardAudio = {
  type: 'resource',
  name: 'plugin-standard-audio',
  provider: (compilation, options) => new StandardAudioResource(compilation, options)
};

export { greenwoodPluginStandardAudio };