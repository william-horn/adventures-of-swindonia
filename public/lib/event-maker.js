
/*
  Import helper functions
*/
const {
  modelArgs,
  objectMeetsCriteria
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


const fireSignal = function(...args) {

  const connections = this.connections;

  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    connection.handler(...args);
  }

}


const disconnectSignal = function(connectionName, handlerFunction) {
  const connections = this.connections;
  let connectionInstance;

  [connectionName, handlerFunction, connectionInstance] = modelArgs([
    [connectionName, 'string'],
    [handlerFunction, 'function'],
    [connectionInstance, 'object']
  ]);

  // special case: if connection object is passed instead of a name or handler function
  if (connectionInstance) {
    connections.splice(
      connections.findIndex(conn => conn === connectionInstance),
      1
    );

    return;
  }

  // disconnect based on connection name or handler function criteria
  for (let i = connections.length - 1; i >= 0; i--) {
    const connection = connections[i];

    if (objectMeetsCriteria(connection, [
      {key: 'name', equals: connectionName, ignoreUndefined: true},
      {key: 'handler', equals: handlerFunction, ignoreUndefined: true},
    ])) {
      connections.splice(i, 1);
    }
  }

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
      fireLimit: -1,
      ...settings
    },

    // event methods
    connect: connectSignal,
    fire: fireSignal,
    disconnect: disconnectSignal,
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent.childEvents.push(event);

  return event;
}

module.exports = {
  event: eventConstructor,
}
