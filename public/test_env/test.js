
// const EventSignal = require('../lib/event-signal');
// const event = EventSignal.event();

// event.test();

const assert = (condition, err) => {
  if (condition) throw err;
}

const isEmpty = object => {
  return Object.keys(object).length === 0;
}

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

      orderedArgs[i] = altTypes[argType];
    }
  }

  return orderedArgs;
}

const connectSignal = function(name, func, key, id) {
  // [name, func] = [
  //   func ? name : undefined,
  //   func ? func : name
  // ]

  [name, func, key, id] = modelArgs([
    [name, 'string'],
    [func, 'function'],
    [key, 'string'],
    [id, 'number']
  ]);

  console.log(name, func, key, id);

}

// connectSignal(5);




/*



*/


const testFunction = function(someString, someNumber, someFunction) {

  [someString, someNumber, someFunction] = modelArgs([
    [someString, 'string'],
    [someNumber, 'number', {boolean: someNumber}],
    [someFunction, 'function']
  ]);

  console.log(someString, someNumber, someFunction);

}

const f = () => {}


// testFunction('string', 100, f);

testFunction(100, false, f);


