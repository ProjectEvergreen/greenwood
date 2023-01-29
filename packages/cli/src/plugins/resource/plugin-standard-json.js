/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['json'];
    this.contentType = 'application/json';
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;
    const isJson = pathname.split('.').pop() === this.extensions[0];
    const isGraphJson = pathname === '/graph.json';
    const isWorkspaceFile = false;
    
    try {
      if (protocol === 'file:') {
        await fs.access(url);
        isWorkspaceFile = true;
      }
    } catch (error) {
      
    }

    return isJson && (isWorkspaceFile || isGraphJson);
  }

  async serve(url) {
    const { pathname } = url;
    const { scratchDir } = this.compilation.context;
    const finalUrl = pathname.startsWith('/graph.json')
      ? new URL('./graph.json', scratchDir)
      : url;
    const contents = await fs.readFile(finalUrl, 'utf-8');

    return new Response(contents, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

const pluginGreenwoodStandardJson = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}];

export { pluginGreenwoodStandardJson };