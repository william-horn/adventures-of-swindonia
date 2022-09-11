

const EventSignal = {};


const modelArgs = (args, model) => {
  const orderedArgs = [];
  const typeHistory = {};

  for (let argName in args) {
    const argValue = args[argName];
    const argType = typeof argValue;

    const argTypeIndex = typeHistory[argType] || 0;
    
    for (let j = argTypeIndex; j < model.length; j++) {
      if (model[j][argName] === argType) {

      }
    }


  }

  return orderedArgs;
}

const connectSignal = function(name, func) {
  // [name, func] = [
  //   func ? name : undefined,
  //   func ? func : name
  // ]

  [name, func] = modelArgs([
    [name, 'string'],
    [func, 'function', {string: name}]
  ]);

}

const defaultEventOptions = {
  cooldown: 0,
  timesFired: 0,
  timesFiredWhilePaused: 0,
}

const eventConstructor = (parentEvent, options) => {
  const event = {
    // event fields
    className: 'EventSignal',

    connections: [],
    childEvents: [],

    parentEvent: parentEvent,

    options: {
      ...options,
      ...defaultEventOptions
    },

    // event methods
    fire: fireConnections
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent.childEvents.push(event);

  return event;
}

EventSignal.event = eventConstructor
module.exports = EventSignal;
