module.exports = {
  
  plugins: [{
    type: 'index',
    provider: function() {
      return {
        hookGreenwoodAnalytics: `
          <div class="hook-analytics">
            <!-- analytics code goes here -->
          </div>
        `
      };
    }
  }, {
    type: 'index',
    provider: function() {
      return {
        hookGreenwoodPolyfills: `
          <!-- 
            this covers custom overriding since polyfills are on by default already
            so for this test, we actully need to load something that works with puppeteer + JSDOM 
          -->
          <div class="hook-polyfills">
            <script src="//cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.2.7/webcomponents-bundle.js"></script>
          </div>
        `
      };
    }
  }]
  
};