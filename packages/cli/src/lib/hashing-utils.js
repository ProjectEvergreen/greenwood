// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2775538
function hashString(inputString) {
  let h = 0;

  for (let i = 0; i < inputString.length; i += 1) {
    h = Math.imul(31, h) + inputString.charCodeAt(i) | 0; // eslint-disable-line no-bitwise
  }

  return Math.abs(h).toString();
}

export {
  hashString
};