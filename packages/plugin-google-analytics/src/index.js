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
          <!-- Google Analytics -->
          <script>
            window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
            ga('create', '${analyticsId}', 'auto');
            ga('send', 'pageview');
          </script>
          
          <script async src='https://www.google-analytics.com/analytics.js'></script>
          <!-- End Google Analytics -->
        `
      };
    }
  }];
};