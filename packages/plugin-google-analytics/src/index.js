const fs = require('fs');
const TransformInterface = require('@greenwood/cli/src/plugins/transforms/transform.interface');

let options = '';

class GoogleAnalyticsPlugin extends TransformInterface {
  
  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.html', '.md'], 
      contentType: 'text/html'
    });
    
    const { analyticsId, anonymous } = options;
    this.analyticsId = analyticsId;

    const validId = analyticsId && typeof analyticsId === 'string';
    this.trackAnon = typeof anonymous === 'boolean' ? anonymous : true;

    if (!validId) {
      throw new Error(`Error: analyticsId should be of type string.  get "${typeof analyticsId}" instead.`);
    }
  }

  shouldTransform() {
    const { request, workspace } = this;
    const { url } = request;

    const barePath = url.endsWith('/')
      ? `${workspace}/pages${url}index`
      : `${workspace}/pages${url.replace('.html', '')}`;

    return fs.existsSync(`${barePath}.md`) || fs.existsSync(`${barePath.replace('/index', '.md')}`);
  }

  async applyTransform(response) {
    
    return new Promise(async (resolve, reject) => {
      try {
        let body = response.body.replace(/<head>/, `<head>
        <link rel="preconnect" href="https://www.google-analytics.com/">

        <script async src="https://www.googletagmanager.com/gtag/js?id=${this.analyticsId}"></script>

        <script>
          var getOutboundLink = function(url) {
            gtag('event', 'click', {
              'event_category': 'outbound',
              'event_label': url,
              'transport_type': 'beacon'
            });
          }

          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${this.analyticsId}', { 'anonymize_ip': ${this.trackAnon} });
          gtag('config', '${this.analyticsId}');
        </script>
      `);

        resolve({
          body,
          contentType: this.contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (opt) => {
  options = opt;
  return [
    {
      type: 'transform-post',
      provider: (req, compilation) => new GoogleAnalyticsPlugin(req, compilation, options)
    }
  ];
};