/*
@author William J. Horn

First version of modelArgs function (for simulating method-overloading)
*/

const assert = require('./assert');
const objectHasNoKeys = require('./objectHasNoKeys');
const keyExistsInObject = require('./keyExistsInObject');

const modelArgs = model => {
  const orderedArgs = [];
  const typeHistory = {};

  for (let i = 0; i < model.length; i++) {
    const modelData = model[i];
    const argValue = modelData[0];
    const altTypes = modelData[2];

    // todo: add more abstract type options here in the future. this is a temp solution
    const argType = Array.isArray(argValue) ? 'array' : typeof argValue;
    // todo //

    const argTypeIndex = typeHistory[argType] || 0;

    for (let j = argTypeIndex; j < model.length; j++) {
      const expectedType = model[j][1];

      if (argType === expectedType && orderedArgs[j] === undefined) { 
        orderedArgs[j] = argValue;
        typeHistory[argType] = j + 1;
        break;
      }
    }

    if (altTypes) {
      assert(
        objectHasNoKeys(altTypes),
        'The AltType object must contain at least one alternate value'
      );

      if (keyExistsInObject(altTypes, argType)) {
        let altValue = altTypes[argType];

        if (typeof altValue === 'function') {
          altValue = altValue();
        }
        
        orderedArgs[i] = altValue
      }
    }
  }

  return orderedArgs;
}

module.exports = modelArgs;