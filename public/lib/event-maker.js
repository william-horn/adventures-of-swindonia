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
  objectMeetsCriteria,
  toUpperCamelCase
} = require('../../lib/helpers');

const EventEnums = {
  ConnectionPriority: {
    Weak: 0,
    Strong: 1,
    Factory: 2
  }
}

const getPriority = priority => {
  const _priority = typeof priority === 'number' ? priority
    : typeof priority === 'string'
      && EventEnums.ConnectionPriority[toUpperCamelCase(priority)];

  if (typeof _priority === 'undefined') throw 'Invalid priority';

  return _priority;
}

const recurse = (list, method, ...args) => {
  for (let i = 0; i < list.length; i++) {
    list[i][method](...args);
  }
}

const filterConnectionArgs = (connectionName, handlerFunction) => {
  return modelArgs_beta([
    { rule: [connectionName, 'string'] },
    { rule: [handlerFunction, 'function'] },
    { rule: [undefined, 'object'] }
  ]);
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
    _connectionPriorities,
    _connectionPriorityOrder: _cpo,
    _pausePriority
  } = event;

  const _signature = {
    ...caller.settings,
    ...signature
  }

  if (!event.isEligibleForDispatch()) {
    return;
  }

  caller._propagating = true;

  for (let i = _cpo.length - 1; i > _pausePriority; i--) {
    const connectionList = _connectionPriorities[i];

    for (let j = 0; j < connectionList.length; j++) {
      const connection = connectionList[i];
      connection.handler(caller, ...args);
    }
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
  Method functions
*/

/*
  event.connect(name, func)

  Connects a handler function to an event

  @param name?<string>
    Name of the event connection

  @param handler<function>
    handler function that runs when the event is fired

  @returns connectionInstance<object>
*/
const connect = function(name, handler) {
  [name, handler] = modelArgs_beta([
    { rule: [name, 'string'] },
    { rule: [handler, 'function', {string: () => name}] }
  ]);

  return this.connectWithPriority(0, { name, handler });
}


const connectWithPriority = function(priority, connectionData) {
  priority = getPriority(priority);
  const { _connectionPriorities, _connectionPriorityOrder: _cpo } = this;

  let connectionList = _connectionPriorities[priority];

  const connection = {
    _active: true,
    ...connectionData
  };

  // creating a new connection priority list if one doesn't exist
  if (!connectionList) {
    connectionList = [];
    _connectionPriorities[priority] = connectionList;
    _cpo.push(priority);

    // sort connection priority indices
    if (_cpo.length > 1) {
      for (let i = _cpo.length - 1; i > 0; i--) {
        if (_cpo[i] < _cpo[i - 1]) {
          [_cpo[i - 1], _cpo[i]] = [_cpo[i], _cpo[i - 1]];
        } else {
          break;
        }
      }
    }
  }

  connectionList.push(connection);
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
  event.fire(...args)

  The interface method for dispatching event connections

  @params ...args<any>
    The arguments passed down to the handler function callbacks

  @returns <void>
*/
const fire = function(...args) {
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
const fireAll = function(...args) {
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

/*
  ...args<connectionName<string>|connectionInstance<object>, handlerFunction<function>>
*/
const disconnect = function(...args) {
  const _connections = this._connections;

  const [
    connectionName, 
    handlerFunction, 
    connectionInstance
  ] = filterConnectionArgs(...args);

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
const disconnectAll = function(...args) {
  this.disconnect(...args);
  recurse(this._childEvents, 'disconnectAll', ...args);
}


const pause = function(...args) {
  const [
    connectionName, 
    handlerFunction, 
    connectionInstance
  ] = filterConnectionArgs(...args);
}

/*

*/ 

const pauseWithPriority = function(priority, connectionData) {
  priority = getPriority(priority);
}

const resume = function() {

}

const isEnabled = function() {
  return this._state !== 'disabled';
}

const isEligibleForDispatch = function() {
  const { 
    _connectionPriorityOrder: _cpo, 
    _pausePriority,
    _state
  } = this;

  const highestPriority = _cpo[_cpo.length - 1];

  // connections list is empty; no connections exist
  if (_cpo.length === 0) return false;

  // event has been disabled
  if (!this.isEnabled()) return false;
  
  // highest priority connection is greater than the paused priority
  if (highestPriority > _pausePriority) return true;

  // highest priority is the only priority and event is listening
  if (highestPriority === _pausePriority && _state === 'listening') return true;

  // todo: possibly reduce logic further in the future
  // return _cpo.length > 0 && this.isEnabled()
  //   && ((highestPriority > _pausePriority) || _state === 'listening');
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
const Event = (parentEvent, settings) => {

  [parentEvent, settings] = modelArgs_beta([
    { rule: [parentEvent, 'EventInstance'] },
    { rule: [settings, 'object'], default: {} }
  ]);

  const event = {
    // event fields
    _customType: 'EventInstance',
    _parentEvent: parentEvent,
    // _connections: [],
    // _priorityConnections: [],
    // _connectionPriorityOrder: [0, 3, 6, ...]
    // _connectionPriorities: {['0']: [], ['1']: [], ...},
    _connectionPriorityOrder: [],
    _connectionPriorities: {},
    _childEvents: [],
    _propagating: false,

    _pausePriority: 0,
    _state: 'listening', // listening | paused:priority_1 | disabled

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
    connect,
    connectWithPriority,
    fire,
    fireAll,
    disconnect,
    disconnectAll,
    pause,
    resume,
    isEligibleForDispatch,
    isEnabled,
    stopPropagating
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent._childEvents.push(event);

  return event;
}

module.exports = {
  Event,
  EventEnums,
  getPriority
}

