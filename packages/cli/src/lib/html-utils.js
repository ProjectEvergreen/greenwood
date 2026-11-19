import { parse, HTMLElement, TextNode } from "node-html-parser";

// Parse HTML while preserving comments, whitespace, and raw-text contents.
function parseHtml(contents) {
  return parse(contents, {
    comment: true,
    blockTextElements: { script: true, style: true, textarea: true, title: true },
  });
}

// Assign raw text without reparsing JavaScript, CSS, or replacement tokens as HTML.
function setHtmlText(element, contents) {
  element.set_content(new TextNode(contents));
}

// Create an element with attributes and optional raw-text contents.
function createHtmlElement(tagName, attributes = {}, contents = undefined) {
  const element = new HTMLElement(tagName, {});
  element.setAttributes(attributes);

  if (contents !== undefined) {
    setHtmlText(element, contents);
  }

  return element;
}

// Append or prepend nodes to the first matching element and serialize the HTML.
function insertHtml(contents, nodes, selector = "head", prepend = false) {
  const root = parseHtml(contents);
  const target = root.querySelector(selector);
  const elements = Array.isArray(nodes) ? nodes : [nodes];

  if (target) {
    if (prepend) {
      target.prepend(...elements);
    } else {
      target.append(...elements);
    }
  }

  return root.toString();
}

// Remove temporary data-gwd-opt attributes from elements and serialize the HTML.
function removeOptimizationAttributes(contents) {
  const root = parseHtml(contents);
  for (const node of root.querySelectorAll("[data-gwd-opt]")) {
    node.removeAttribute("data-gwd-opt");
  }
  return root.toString();
}

export { parseHtml, setHtmlText, createHtmlElement, insertHtml, removeOptimizationAttributes };
