/*
@author William J. Horn

for finding falsey values in objects
*/

const isEmpty = require('./isEmpty');

const keyExistsInObject = (object, key) => {
  if (isEmpty(object)) return false;
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    if (key === keys[i]) return true;
  }

  return false;
}

module.exports = keyExistsInObject;