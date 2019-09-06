module.exports = (analyticsId) => {
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