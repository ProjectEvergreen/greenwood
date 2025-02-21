import fs from "fs/promises";
import { hashString } from "./hashing-utils.js";
import { getResolvedHrefFromPathnameShortcut } from "../lib/node-modules-utils.js";
import * as htmlparser from "node-html-parser";
import { asyncMap } from "./async-utils.js";

async function modelResource(
  context,
  type,
  src = undefined,
  contents = undefined,
  optimizationAttr = undefined,
  rawAttributes = undefined,
) {
  const { scratchDir, userWorkspace, projectDirectory } = context;
  const extension = type === "script" ? "js" : "css";
  let sourcePathURL;

  if (src) {
    sourcePathURL = src.startsWith("/node_modules/")
      ? new URL(getResolvedHrefFromPathnameShortcut(src, projectDirectory))
      : src.startsWith("/")
        ? new URL(`.${src}`, userWorkspace)
        : new URL(`./${src.replace(/\.\.\//g, "").replace("./", "")}`, userWorkspace);

    contents = await fs.readFile(sourcePathURL, "utf-8");
  } else {
    const scratchFileName = hashString(contents);

    sourcePathURL = new URL(`./${scratchFileName}.${extension}`, scratchDir);
    await fs.writeFile(sourcePathURL, contents);
  }

  return {
    src, // if <script src="..."></script> or <link href="..."></link>
    sourcePathURL, // src as a URL
    type,
    contents,
    optimizedFileName: undefined,
    optimizedFileContents: undefined,
    optimizationAttr,
    rawAttributes,
  };
}

function mergeResponse(destination, source) {
  const headers = destination.headers || new Headers();
  const status = source.status || destination.status;
  const statusText = source.statusText || destination.statusText;

  source.headers.forEach((value, key) => {
    // TODO better way to handle Response automatically setting content-type
    // https://github.com/ProjectEvergreen/greenwood/issues/1049
    const isDefaultHeader =
      key.toLowerCase() === "content-type" && value === "text/plain;charset=UTF-8";

    if (!isDefaultHeader) {
      headers.set(key, value);
    }
  });

  return new Response(source.body, {
    headers,
    status,
    statusText,
  });
}

// On Windows, a URL with a drive letter like C:/ thinks it is a protocol and so prepends a /, e.g. /C:/
// This is fine with newer fs methods that Greenwood uses, but tools like Rollup and PostCSS will need this handled manually
// https://github.com/rollup/rollup/issues/3779
function normalizePathnameForWindows(url) {
  const windowsDriveRegex = /\/[a-zA-Z]{1}:\//;
  const { pathname = "", searchParams } = url;
  const params = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  if (windowsDriveRegex.test(pathname)) {
    const driveMatch = pathname.match(windowsDriveRegex)[0];

    return `${pathname.replace(driveMatch, driveMatch.replace("/", ""))}${params}`;
  }

  return `${pathname}${params}`;
}

async function checkResourceExists(url) {
  if (url.pathname === "/") {
    return false;
  }

  try {
    await fs.access(url);
    return true;
  } catch {
    return false;
  }
}

// turn relative paths into relatively absolute based on a known root directory
// * deep link route - /blog/releases/some-post
// * and a nested path in the layout - ../../styles/theme.css
// so will get resolved as `${rootUrl}/styles/theme.css`
async function resolveForRelativeUrl(url, rootUrl) {
  const search = url.search || "";
  let reducedUrl;

  if (await checkResourceExists(new URL(`.${url.pathname}`, rootUrl))) {
    return new URL(`.${url.pathname}${search}`, rootUrl);
  }

  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  segments.shift();

  for (let i = 0, l = segments.length; i < l; i += 1) {
    const nextSegments = segments.slice(i);
    const urlToCheck = new URL(`./${nextSegments.join("/")}`, rootUrl);

    if (await checkResourceExists(urlToCheck)) {
      reducedUrl = new URL(`${urlToCheck}${search}`);
    }
  }

  return reducedUrl;
}

async function trackResourcesForRoute(html, compilation, route) {
  const { context } = compilation;
  const root = htmlparser.parse(html, {
    script: true,
    style: true,
  });

  // intentionally support <script> tags from the <head> or <body>
  const scripts = await asyncMap(
    Array.from(root.querySelectorAll("script")).filter(
      (script) =>
        (isLocalLink(script.getAttribute("src")) || script.rawText) &&
        script.rawAttrs.indexOf("importmap") < 0 &&
        script.getAttribute("type") !== "application/json",
    ),
    async (script) => {
      const src = script.getAttribute("src");
      const optimizationAttr = script.getAttribute("data-gwd-opt");
      const { rawAttrs } = script;

      if (src) {
        // <script src="...."></script>
        return await modelResource(context, "script", src, null, optimizationAttr, rawAttrs);
      } else if (script.rawText) {
        // <script>...</script>
        return await modelResource(
          context,
          "script",
          null,
          script.rawText,
          optimizationAttr,
          rawAttrs,
        );
      }
    },
  );

  const styles = await asyncMap(
    Array.from(root.querySelectorAll("style")).filter(
      (style) => !/\$/.test(style.rawText) && !/<!-- Shady DOM styles for -->/.test(style.rawText),
    ), // filter out Shady DOM <style> tags that happen when using puppeteer
    async (style) =>
      await modelResource(
        context,
        "style",
        null,
        style.rawText,
        null,
        style.getAttribute("data-gwd-opt"),
      ),
  );

  const links = await asyncMap(
    Array.from(root.querySelectorAll("link")).filter((link) => {
      // <link rel="stylesheet" href="..."></link>
      return (
        link.getAttribute("rel") === "stylesheet" &&
        link.getAttribute("href") &&
        isLocalLink(link.getAttribute("href"))
      );
    }),
    async (link) => {
      return await modelResource(
        context,
        "link",
        link.getAttribute("href"),
        null,
        link.getAttribute("data-gwd-opt"),
        link.rawAttrs,
      );
    },
  );

  const resources = [...scripts, ...styles, ...links];

  resources.forEach((resource) => {
    compilation.resources.set(resource.sourcePathURL.pathname, resource);
  });

  compilation.graph.find((page) => page.route === route).resources = resources.map(
    (resource) => resource.sourcePathURL.pathname,
  );

  return resources;
}

function isLocalLink(url = "") {
  return url !== "" && !url.startsWith("http") && !url.startsWith("//");
}

// TODO handle full request
// https://github.com/ProjectEvergreen/greenwood/discussions/1146
function transformKoaRequestIntoStandardRequest(url, request) {
  const { body, method, header } = request;
  const headers = new Headers(header);
  const contentType = headers.get("content-type") || "";
  let format;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = new FormData();

    for (const key of Object.keys(body)) {
      formData.append(key, body[key]);
    }

    // when using FormData, let Request set the correct headers
    // or else it will come out as multipart/form-data
    // https://stackoverflow.com/a/43521052/417806
    headers.delete("content-type");

    format = formData;
  } else if (contentType.includes("application/json")) {
    format = JSON.stringify(body);
  } else {
    format = body;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#parameters
  return new Request(url, {
    body: ["GET", "HEAD"].includes(method.toUpperCase()) ? null : format,
    method,
    headers,
  });
}

// https://stackoverflow.com/questions/57447685/how-can-i-convert-a-request-object-into-a-stringifiable-object-in-javascript
async function requestAsObject(_request) {
  if (!(_request instanceof Request)) {
    throw Object.assign(new Error(), {
      name: "TypeError",
      message: "Argument must be a Request object",
    });
  }

  const request = _request.clone();
  const contentType = request.headers.get("content-type") || "";
  let headers = Object.fromEntries(request.headers);
  let format;

  function stringifiableObject(obj) {
    const filtered = {};
    for (const key in obj) {
      if (["boolean", "number", "string"].includes(typeof obj[key]) || obj[key] === null) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const params = {};

    for (const entry of formData.entries()) {
      params[entry[0]] = entry[1];
    }

    // when using FormData, let Request set the correct headers
    // or else it will come out as multipart/form-data
    // for serialization between route workers, leave a special marker for Greenwood
    // https://stackoverflow.com/a/43521052/417806
    headers["content-type"] = "x-greenwood/www-form-urlencoded";
    format = JSON.stringify(params);
  } else if (contentType.includes("application/json")) {
    format = JSON.stringify(await request.json());
  } else {
    format = await request.text();
  }

  return {
    ...stringifiableObject(request),
    body: format,
    headers,
  };
}

export {
  checkResourceExists,
  mergeResponse,
  modelResource,
  normalizePathnameForWindows,
  requestAsObject,
  resolveForRelativeUrl,
  trackResourcesForRoute,
  transformKoaRequestIntoStandardRequest,
  isLocalLink,
};
