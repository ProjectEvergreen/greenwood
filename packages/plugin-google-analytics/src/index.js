module.exports = (analyticsId) => {
  const validId = analyticsId && typeof analyticsId === 'string';

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

            gtag('config', '${analyticsId}');
          </script>
        `
      };
    }
  }];
};