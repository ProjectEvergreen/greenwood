module.exports = {
  
  plugins: [{
    type: 'index',
    provider: () => {
      return {
        hookAnalytics: `
          <div class="hook-analytics">
            <!-- TODO analytics code here -->
          </div>
        `
      };
    }
  }, {
    type: 'index',
    provider: () => {
      return {
        hookPolyfills: `
          <div class="hook-polyfills">
            <!-- TODO polyfills code here -->
          </div>
        `
      };
    }
  }]
  
};