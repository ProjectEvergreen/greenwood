module.exports = {
  
  plugins: [{
    type: 'hook',
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
    type: 'hook',
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