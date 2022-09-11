
const assert = require('./assert');
const isEmpty = require('./isEmpty');
const keyExistsInObject = require('./keyExistsInObject');

const modelArgs = model => {
  const orderedArgs = [];
  const typeHistory = {};

  for (let i = 0; i < model.length; i++) {
    const modelData = model[i];
    const argValue = modelData[0];
    const altTypes = modelData[2];

    const argType = typeof argValue;
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
        isEmpty(altTypes),
        'The AltType object must contain at least one alternate value'
      );

      if (keyExistsInObject(altTypes, argType)) {
        orderedArgs[i] = altTypes[argType];
      }
    }
  }

  return orderedArgs;
}

module.exports = modelArgs;