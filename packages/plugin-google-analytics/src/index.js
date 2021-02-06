const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class GoogleAnalyticsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    const { analyticsId } = options;

    if (!analyticsId || typeof analyticsId !== 'string') {
      throw new Error(`Error: analyticsId should be of type string.  got "${typeof analyticsId}" instead.`);
    }
  }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html');
  }

  async optimize(url, body) {
    const { analyticsId, anonymous } = this.options;
    const trackAnon = typeof anonymous === 'boolean' ? anonymous : true;

    return new Promise((resolve, reject) => {
      try {
        const newHtml = body.replace('</head>', `
          <link rel="preconnect" href="https://www.google-analytics.com/">
          <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
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
            gtag('config', '${analyticsId}', { 'anonymize_ip': ${trackAnon} });
            gtag('config', '${analyticsId}');
          </script>
        </head>
        `);

        resolve(newHtml);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-google-analytics',
    provider: (compilation) => new GoogleAnalyticsResource(compilation, options)
  };
};