import { parse, NodeType } from "node-html-parser";

// whitespace inside these elements is significant, or is already handled by the bundler
const PRESERVED_TAGS = ["pre", "textarea", "script", "style", "noscript"];

// Lit SSR hydration markers (<!--lit-part ...--> / <!--/lit-part-->) and license style
// comments (<!--! ... -->) must survive minification
// https://github.com/ProjectEvergreen/greenwood/issues/357
const DEFAULT_IGNORED_COMMENTS = [/^!/, /^\/?lit-/];

function minifyNode(node, ignoredComments) {
  for (const childNode of [...node.childNodes]) {
    if (childNode.nodeType === NodeType.COMMENT_NODE) {
      const contents = childNode.rawText.trim();

      if (!ignoredComments.some((pattern) => pattern.test(contents))) {
        node.removeChild(childNode);
      }
    } else if (childNode.nodeType === NodeType.TEXT_NODE) {
      childNode.rawText = childNode.rawText.replace(/[ \t\r\n\f]+/g, " ");
    } else if (
      childNode.nodeType === NodeType.ELEMENT_NODE &&
      !PRESERVED_TAGS.includes(childNode.rawTagName?.toLowerCase())
    ) {
      minifyNode(childNode, ignoredComments);
    }
  }
}

class MinifyHtmlResource {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.contentType = "text/html";
  }

  async shouldOptimize(url, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    const ignoredComments = this.options.ignoreCustomComments ?? DEFAULT_IGNORED_COMMENTS;
    const body = await response.text();
    const root = parse(body, {
      comment: true,
      blockTextElements: {
        script: true,
        style: true,
        noscript: true,
        pre: true,
        textarea: true,
      },
    });

    minifyNode(root, ignoredComments);

    return new Response(root.toString(), {
      headers: response.headers,
    });
  }
}

/** @type {import('./types/index.d.ts').MinifyHtmlPlugin} */
const greenwoodPluginMinifyHtml = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-minify-html",
      provider: (compilation) => new MinifyHtmlResource(compilation, options),
    },
  ];
};

export { greenwoodPluginMinifyHtml };
