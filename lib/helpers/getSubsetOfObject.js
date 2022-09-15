

const getSubsetOfObject = (object, keys) => {
  const subObj = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    subObj[key] = object[key];
  }

  return subObj;
}

module.exports = getSubsetOfObject;