
/*
  Import helper functions
*/
const {
  modelArgs
} = require('../../lib/helpers');


const EventSignal = {};


/*
  Declare method functions
*/
const connectSignal = function(name, func) {
  [name, func] = modelArgs([
    [name, 'string'],
    [func, 'function', {string: name}]
  ]);

  const connection = {
    handler: func,
    name: name,
  }

  this.connections.push(connection);
  return connection;
}


/*
  Declare constructor functions
*/
const eventConstructor = (parentEvent, settings) => {
  const event = {
    // event fields
    className: 'EventSignal',

    connections: [],
    childEvents: [],

    parentEvent: parentEvent,

    stats: {
      timesFired: 0,
      timesFiredWhilePaused: 0,
    },

    settings: {
      cooldown: 0,
      ...settings
    },

    // event methods
    connect: connectSignal
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent.childEvents.push(event);

  return event;
}

module.exports = {
  event: eventConstructor,
}
