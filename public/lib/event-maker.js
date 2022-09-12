
/*
  Import helper functions
*/
const {
  modelArgs,
  objectMeetsCriteria
} = require('../../lib/helpers');


const EventSignal = {};

const recurse = (list, method, ...args) => {
  for (let i = 0; i < list.length; i++) {
    list[i][method](...args);
  }
}

const dispatchConnections = (connections, ...args) => {
  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    connection.handler(...args);
  }
}

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
  const { 
    settings, 
    connections
  } = this;

  dispatchConnections(connections, ...args);

  if (settings.linked) {

  }
}

const fireAllSignal = function(...args) {
  dispatchConnections(this.connections, ...args);
  recurse(this.childEvents, 'fireAll', ...args);
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

  const isEligibleForDisconnect = connection => {
    return objectMeetsCriteria(connection, [
      {key: 'name', equals: connectionName, ignoreUndefined: true},
      {key: 'handler', equals: handlerFunction, ignoreUndefined: true},
    ]); 
  }

  // disconnect based on connection name or handler function criteria
  for (let i = connections.length - 1; i >= 0; i--) {
    const connection = connections[i];

    if (arguments.length === 0 || isEligibleForDisconnect(connection)) {
      connections.splice(i, 1);
    }
  }

}

const disconnectAllSignal = function(...args) {
  this.disconnect(...args);
  recurse(this.childEvents, 'disconnectAll', ...args);
}


/*
  Declare constructor functions
*/
const eventConstructor = (childEvents, settings) => {

  // [childEvents, settings] = modelArgs([
  //   [childEvents, 'array', {object: settings}],
  //   [settings, 'object']
  // ]);


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
      // determines delay between event firing for every interval number of times
      cooldown: {interval: 1, duration: 0},

      // determines number of times event can be fired before it is disabled
      fireLimit: -1,

      // determines if parent event will fire when child fires
      linked: false,
      ...settings
    },

    // event methods
    connect: connectSignal,
    fire: fireSignal,
    fireAll: fireAllSignal,
    disconnect: disconnectSignal,
    disconnectAll: disconnectAllSignal,
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent.childEvents.push(event);

  return event;
}

module.exports = {
  event: eventConstructor,
}

