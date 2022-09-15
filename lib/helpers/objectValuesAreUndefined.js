
const objectValuesAreUndefined = object => {
  for (key in object) {
    if (object[key]) return false;
  }
  return true;
}

module.exports = objectValuesAreUndefined;

