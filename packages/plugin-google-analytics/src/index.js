module.exports = (options = {}) => {
  const { analyticsId, anonymous } = options;

  const validId = analyticsId && typeof analyticsId === 'string';
  const trackAnon = typeof anonymous === 'boolean' ? anonymous : true;

  if (!validId) {
    throw new Error(`Error: analyticsId should be of type string.  get "${typeof analyticsId}" instead.`);
  }

  return [{
    type: 'index',
    provider: () => {
      return {
        hookAnalytics: `
          <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
          
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${analyticsId}', { 'anonymize_ip': ${trackAnon} });
            gtag('config', '${analyticsId}');
          </script>
        `
      };
    }
  }];
};