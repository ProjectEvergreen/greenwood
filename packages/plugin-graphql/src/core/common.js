// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2775538
function hashString(inputString) {
  let h = 0;

  for (let i = 0; i < inputString.length; i += 1) {
    h = (Math.imul(31, h) + inputString.charCodeAt(i)) | 0;
  }

  return Math.abs(h).toString();
}

export { hashString };

function getQueryHash(query, variables = {}) {
  const queryKeys = query;
  const variableValues =
    Object.keys(variables).length > 0
      ? `_${Object.values(variables).join("").replace(/\//g, "")}` // handle / which will translate to filepaths
      : "";

  return hashString(`${queryKeys}${variableValues}`);
}

export { getQueryHash };
