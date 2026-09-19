export async function getFrontmatter() {
  return {
    staticExport: true,
  };
}

export async function getBody(compilation, page, request) {
  const value = new URL(request.url).searchParams.get("value") ?? "build";

  return `<h1>static export: ${value}</h1>`;
}
