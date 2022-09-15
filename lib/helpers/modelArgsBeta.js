/*
@author William J. Horn

Better version of modelArgs function. Still in beta
~ Will

[arr, obj] = modelArgs_beta([
  {rule: [arr, 'array', {string: 5}], default: []},
  {rule: [obj, 'object'], default: {}}
]);


modelArgs(...args, [
  { rules: ['type'] },
  ...
])
*/

// const assert = require('./assert');
// const objectHasNoKeys = require('./objectHasNoKeys');
const keyExistsInObject = require('./keyExistsInObject');

// todo: look into optimizing this function using systems of equations for logic deduction

const modelArgs_beta = (model, ...args) => {
  const orderedArgs = [];
  const typeHistory = {};
  const lockedIndices = {};
  const modelLength = model.length;
  const argList = [...args];
  const argKeyList = Object.keys(argList);
  const useArgList = argList.length > 0;

  const ruleIndex = useArgList 
    ? [2, 0, 1] 
    : [0, 1, 2];

  const [
    argValIndex,
    argTypeIndex, 
    altTypeIndex
  ] = ruleIndex

  for (let i = 0; i < modelLength; i++) {
    const modelData = model[i];
    const modelRule = modelData.rule;
    const argKey = argKeyList[i];

    if (useArgList) modelRule[2] = argList[argKey];

    const argValue = modelRule[argValIndex]; 
    const altTypes = modelRule[altTypeIndex];
    const primArgType = typeof argValue;

    const argType = Array.isArray(argValue) ? 'array' 
      : (primArgType === 'object' && argValue._customType)
          || primArgType;

    let startIndex = typeHistory[argType] || 0;

    for (startIndex; startIndex < modelLength; startIndex++) {
      const expectedType = model[startIndex].rule[argTypeIndex];

      if (argType === expectedType && !lockedIndices[startIndex]) {
        orderedArgs[startIndex] = argValue;
        typeHistory[argType] = startIndex + 1;
        lockedIndices[startIndex] = true;
        break;
      }
    }

    if (altTypes && keyExistsInObject(altTypes, argType)) {
      let altValue = altTypes[argType];

      if (typeof altValue === 'function') {
        altValue = altValue();
      }
      
      // this will overwrite args placed in the reassignment process
      orderedArgs[i] = altValue;
      lockedIndices[i] = true;

    } else if (!lockedIndices[i]) {
      // assign default value if the current index is not locked
      orderedArgs[i] = modelData.default;
    }
  }

  return orderedArgs;
}

module.exports = modelArgs_beta;