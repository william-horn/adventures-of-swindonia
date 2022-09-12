/*
@author:  William J. Horn
@file:    event-maker.js
@date:    09/05/2022
==================================================================================================================================

@info
=========
| ABOUT |
==================================================================================================================================

EventMaker was built from scratch by William J. Horn with yet another desperate attempt to re-invent the wheel 
just "because". On a real note though, this is a pretty neat and efficient implementation of custom event handling. 

This library lets you manage:

  * Event bubbling
  * Event toggling
  * Creating event sequences (coming soon)
  * and more

Documentation can be found here: https://github.com/william-horn/adventures-of-swindonia/blob/develop/public/lib/documentation/event-maker.md

==================================================================================================================================

@todo
========
| TODO |
==================================================================================================================================

todo: add event yielding (promise-based awaiting for event dispatches)
todo: create constructor for event sequences (events for sequential event dispatches, like key combinations)
todo: implement pause/resume mechanic for events
todo: implement event connection strength/priorities

==================================================================================================================================
*/

/*
  Helper functions
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
  Method functions
*/

/*
  event.connect(name, func)

  Connects a handler function to an event

  @param name?<string>
    Name of the event connection

  @param func<function>
    handler function that runs when the event is fired

  @returns connectionInstance<object>
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

/*
  event.stopPropagation()

  Stops the caller event from propagating through 
  event bubbling

  @params <void>
  @returns <void>
*/
const stopPropagating = function() {
  this._propagating = false;
}

/*
  dispatchEvent(payload, ...args)

  The internal function call for dispatching events

  @param payload<object>
    The data describing the dispatched event. The payload
    object is structured as such:

    payload {
      caller<EventInstance> { ... },
      event<EventInstance> { ... },
      signature?<object> {
        bubbling?<boolean>,
        continuePropagation?<boolean>
      }
    }

  @param ...args<any>
    The rest of the arguments passed by the user
      
  @returns <void>
*/
const dispatchEvent = function(payload, ...args) {
  const { event, caller, signature = {} } = payload;

  const { 
    linkedEvents,
    cooldown,
    dispatchLimit
  } = event.settings;

  const {
    timeLastDispatched,
    dispatchCount,
  } = event.stats

  const {
    _connections,
  } = event;

  const _signature = {
    ...caller.settings,
    ...signature
  }

  // todo: when event state is implemented add a guard clause here when limit is reached
  if (dispatchLimit && dispatchCount >= dispatchLimit) {
    console.log('dispatch limit reached');
    return event.disconnect();
  }

  event.stats.dispatchCount++;
  caller._propagating = true;

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
          // continuePropagation: doesn't set _propagating to false after linked events fire
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

  } else if (!_signature.continuePropagation) {
    caller._propagating = false;
  }
}

/*
  event.fire(...args)

  The interface method for dispatching event connections

  @params ...args<any>
    The arguments passed down to the handler function callbacks

  @returns <void>
*/
const fireSignal = function(...args) {
  dispatchEvent({
    event: this,
    caller: this
  }, ...args);
}

/*
  event.fireAll(...args)

  The interface method for dispatching all event connections
  and all descendant event connections

  @params ...args<any>
    The arguments passed down to the handler function callbacks

  @returns <void>
*/
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

/*
  event.disconnect(connectionName?<string, connectionInstance>, handlerFunction?<function>)

  The interface method for disconnecting event connections. Arguments passed to this
  function are filters to target and disconnect individual or groups of event
  connections.

  @param connectionName<string>
    The name of the connection instance to be disconnected

  @param connectionName<connectionInstance>
    The literal connection instance returned from event.connect() to be
    disconnected

  @param handlerFunction<function>
    The literal handler function used in the event connections to be
    disconnected

  @note In the future these arguments will probably be replaced with
  an options object for more filtering options

  @returns <void>
*/
const disconnectSignal = function(connectionName, handlerFunction) {
  const _connections = this._connections;
  let connectionInstance;

  [connectionName, handlerFunction, connectionInstance] = modelArgs_beta([
    { rule: [connectionName, 'string'] },
    { rule: [handlerFunction, 'function'] },
    { rule: [connectionInstance, 'object'] }
  ]);

  /*
    special case: if connection object is passed instead of a name or handler function
    then disconnect the connection instance
  */
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

/*
  event.disconnectAll(...args)

  The interface method for disconnecting event connections
  and descendant event connections based on filter arguments

  @params (same as event.disconnect)

  @returns <void>
*/
const disconnectAllSignal = function(...args) {
  this.disconnect(...args);
  recurse(this._childEvents, 'disconnectAll', ...args);
}


/*
  event.connectWithPriority(1, 'name', handler)

  priorityEnums {
    weak: 0
    strong: 1,
    factory: 2,
    ...
  }

  event.connect(...) 
    === event.connectWithPriority(0, ...)
    === event.connectWithPriority('weak', ...)

  event.connectStrong(...) 
    === event.connectWithPriority(1, ...) 
    === event.connectWithPriority('strong', ...)

  event.connectFactory(...)
    === event.connectWithPriority(2, ...)
    === event.connectWithPriority('factory', ...)

  event.pause(...) 
    === event.pauseWithPriority(0, ...)
    === event.pauseWithPriority('weak', ...)

  event.pauseStrong(...)
    === event.pauseWithPriority(1, ...)
    === event.pauseWithPriority('strong', ...)

  event.pauseFactory(...)
    === event.pauseWithPriority(2, ...)
    === event.pauseWithPriority('factory', ...)

  event.pauseWithPriority('*', ...)
    === event.pauseWithPriority(Infinity, ...)


  event.pause('*')
*/

const pauseSignal = function(priority) {

}

const pauseAllSignal = function() {

}

const resumeSignal = function() {

}

const resumeAllSignal = function() {

}

const setListeningPriority = function() {

}


/*
  Declare constructor functions
*/

/*
  event(parentEvent?<EventInstance>, settings?<object>)

  Constructor function for creating a standard event

  @param parentEvent<EventInstance>
    Another event instance that will act as the parent for the current event.

  @param settings<object>
    An object of additional settings that will configure the behavior of the 
    current event.

  @returns event<EventInstance>
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
    _priorityConnections: [],
    _childEvents: [],
    _propagating: false,

    _listeningPriority: 0,
    _pausedPriority: 0,
    _state: 'listening',

    stats: {
      timeLastDispatched: 0,
      dispatchCount: 0,
      dispatchWhilePausedCount: 0,
    },

    settings: {
      /*
      cooldown: { 
        interval: 1, 
        duration: 0,
        reset: 0,
      },

      dispatchLimit: 1,
      */
      linkedEvents: [],
      bubbling: false,

      ...settings
    },

    // event methods
    connect: connectSignal,
    fire: fireSignal,
    fireAll: fireAllSignal,
    disconnect: disconnectSignal,
    disconnectAll: disconnectAllSignal,
    pause: pauseSignal,
    pauseAll: pauseAllSignal,
    resume: resumeSignal,
    resumeAll: resumeAllSignal,

    stopPropagating
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent._childEvents.push(event);

  return event;
}

module.exports = {
  event: eventConstructor,
}

