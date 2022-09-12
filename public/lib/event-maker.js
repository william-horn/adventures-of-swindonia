
/*
  Import helper functions
*/
const {
  modelArgs_beta,
  objectMeetsCriteria
} = require('../../lib/helpers');


const recurse = (list, method, ...args) => {
  for (let i = 0; i < list.length; i++) {
    list[i][method](...args);
  }
}

/*
  Declare method functions
*/
const connectSignal = function(name, func) {
  [name, func] = modelArgs_beta([
    { rule: [name, 'string'] },
    { rule: [func, 'function', {string: () => name}] }
  ]);

  const connection = {
    handler: func,
    name: name,
  }

  this._connections.push(connection);
  return connection;
}

const stopPropagating = function() {
  this._propagating = false;
}

const dispatchEvent = function(payload, ...args) {
  const { event, caller, signature = {} } = payload;

  const linkedEvents = event.settings.link;
  const _connections = event._connections;

  caller._propagating = true;

  const _signature = {
    ...caller.settings,
    ...signature
  }

  for (let i = 0; i < _connections.length; i++) {
    const connection = _connections[i];
    connection.handler(caller, ...args);
  }

  if (linkedEvents.length > 0) {
    for (let i = 0; i < linkedEvents.length; i++) {
      const linkedEvent = linkedEvents[i];
      dispatchEvent({
        event: linkedEvent,
        caller: caller,
        signature: { 
          continuePropagation: true,
          bubbling: linkedEvent.settings.bubbling
        }
      }, ...args);
    }
  }

  if (_signature.bubbling && event._parentEvent && caller._propagating) {
    dispatchEvent({
      caller: event,
      event: event._parentEvent,
      signature: _signature,
    }, ...args);
  }

  if (!_signature.continuePropagation) {
    caller._propagating = false;
  }
}


const fireSignal = function(...args) {
  dispatchEvent({
    event: this,
    caller: this
  }, ...args);
}

const fireAllSignal = function(...args) {
  dispatchEvent({
    event: this,
    caller: this,
    signature: {
      bubbling: false
    }
  }, ...args);

  recurse(this._childEvents, 'fireAll', ...args);
}

const disconnectSignal = function(connectionName, handlerFunction) {
  const _connections = this._connections;
  let connectionInstance;

  [connectionName, handlerFunction, connectionInstance] = modelArgs_beta([
    { rule: [connectionName, 'string'] },
    { rule: [handlerFunction, 'function'] },
    { rule: [connectionInstance, 'object'] }
  ]);

  // special case: if connection object is passed instead of a name or handler function
  if (connectionInstance) {
    _connections.splice(
      _connections.findIndex(conn => conn === connectionInstance),
      1
    );

    return;
  }

  const isEligibleForDisconnect = connection => {
    return objectMeetsCriteria(connection, [
      { key: 'name', equals: connectionName, ignoreUndefined: true },
      { key: 'handler', equals: handlerFunction, ignoreUndefined: true },
    ]); 
  }

  // disconnect based on connection name or handler function criteria
  for (let i = _connections.length - 1; i >= 0; i--) {
    const connection = _connections[i];

    if (arguments.length === 0 || isEligibleForDisconnect(connection)) {
      _connections.splice(i, 1);
    }
  }

}

const disconnectAllSignal = function(...args) {
  this.disconnect(...args);
  recurse(this._childEvents, 'disconnectAll', ...args);
}


/*
  Declare constructor functions
*/
const eventConstructor = (parentEvent, settings) => {

  [parentEvent, settings] = modelArgs_beta([
    { rule: [parentEvent, 'EventInstance'] },
    { rule: [settings, 'object'], default: {} }
  ]);

  const event = {
    // event fields
    _customType: 'EventInstance',
    _parentEvent: parentEvent,
    _connections: [],
    _childEvents: [],
    _propagating: false,

    _stats: {
      timesFired: 0,
      timesFiredWhilePaused: 0,
    },

    settings: {
      cooldown: { 
        interval: 1, 
        duration: 0 
      },
      fireLimit: -1,
      link: [],
      bubbling: false,

      ...settings
    },

    // event methods
    connect: connectSignal,
    fire: fireSignal,
    fireAll: fireAllSignal,
    disconnect: disconnectSignal,
    disconnectAll: disconnectAllSignal,

    stopPropagating
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent._childEvents.push(event);

  return event;
}

module.exports = {
  event: eventConstructor,
}

