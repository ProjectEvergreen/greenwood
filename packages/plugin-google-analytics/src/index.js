import { createHtmlElement, insertHtml } from "@greenwood/cli/src/lib/html-utils.js";

class GoogleAnalyticsResource {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;

    const { analyticsId } = options;

    if (!analyticsId || typeof analyticsId !== "string") {
      throw new Error(
        `Error: analyticsId should be of type string.  got "${typeof analyticsId}" instead.`,
      );
    }

    this.contentType = "text/html";
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0;
  }

  async intercept(url, request, response) {
    const { analyticsId, anonymous } = this.options;
    const trackAnon = typeof anonymous === "boolean" ? anonymous : true;
    let body = await response.text();

    body = insertHtml(body, [
      createHtmlElement("link", { rel: "preconnect", href: "https://www.google-analytics.com/" }),
      createHtmlElement("script", {
        async: "",
        src: `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`,
      }),
      createHtmlElement(
        "script",
        { "data-gwd-opt": "none" },
        `
        var getOutboundLink = function(url) {
          gtag('event', 'click', {
            'event_category': 'outbound',
            'event_label': url,
            'transport_type': 'beacon'
          });
        }
        globalThis.dataLayer = globalThis.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analyticsId}', { 'anonymize_ip': ${trackAnon} });`,
      ),
    ]);

    return new Response(body, {
      headers: response.headers,
    });
  }
}

/** @type {import('./types/index.d.ts').GoogleAnalyticsPlugin} */
const greenwoodPluginGoogleAnalytics = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-google-analytics",
      provider: (compilation) => new GoogleAnalyticsResource(compilation, options),
    },
  ];
};

export { greenwoodPluginGoogleAnalytics };
