function tagsMatch(tagName, html) {
  const openTagRegex = new RegExp(`<${tagName}`, 'g');
  const closeTagRegex = new RegExp(`<\/${tagName.replace('>', '')}>`, 'g');
  const openingCount = (html.match(openTagRegex) || []).length;
  const closingCount = (html.match(closeTagRegex) || []).length;
  
  return openingCount === closingCount;
}

module.exports = {
  tagsMatch
};