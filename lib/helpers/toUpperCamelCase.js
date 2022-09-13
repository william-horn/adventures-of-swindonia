
const toCamelCase = require('./toCamelCase');

const toUpperCamelCase = str => {
  return toCamelCase(str).replace(/^./, first => first.toUpperCase());
}

module.exports = toUpperCamelCase;


