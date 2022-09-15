/*
@author William J. Horn

for finding falsey values in objects
*/

const objectHasNoKeys = require('./objectHasNoKeys');

const keyExistsInObject = (object, key) => {
  if (objectHasNoKeys(object)) return false;
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    if (key === keys[i]) return true;
  }

  return false;
}

module.exports = keyExistsInObject;