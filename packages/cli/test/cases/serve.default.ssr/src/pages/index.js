async function getBody() {
  const price = "costs $& $$ $1 $` $' and \\ backslashes";

  return `
    <h1>Hello from the server rendered home page!</h1>
    <p id="replacement-tokens">${price}</p>
  `;
}

export { getBody };
