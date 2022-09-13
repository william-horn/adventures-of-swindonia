
const toCamelCase = str => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, first) => first.toUpperCase());
}

module.exports = toCamelCase;
