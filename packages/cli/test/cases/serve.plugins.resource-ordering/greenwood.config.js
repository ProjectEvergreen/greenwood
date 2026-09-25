class BodyOnlyResponseResource {
  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.includes("text/html");
  }

  async intercept(url, request, response) {
    const body = await response.text();

    return new Response(
      body.replace("</head>", '<meta name="first-plugin" content="complete"></head>'),
    );
  }
}

class HtmlResponseResource {
  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.includes("text/html");
  }

  async intercept(url, request, response) {
    const body = await response.text();

    return new Response(
      body.replace("</head>", '<meta name="second-plugin" content="complete"></head>'),
    );
  }
}

export default {
  plugins: [
    {
      type: "resource",
      name: "plugin-body-only-response",
      provider: () => new BodyOnlyResponseResource(),
    },
    {
      type: "resource",
      name: "plugin-html-response",
      provider: () => new HtmlResponseResource(),
    },
  ],
};
