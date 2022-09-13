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
  toUpperCamelCase,
  isEmpty
} = require('../../lib/helpers');

const EventEnums = {
  ConnectionPriority: {
    Weak: 0,
    Strong: 1,
    Factory: 2
  },

  StateType: {
    Listening: 'Listening',
    Paused: 'Paused',
    Disabled: 'Disabled'
  },

  InstanceType: {
    EventConnection: 'EventConnection',
    EventInstance: 'EventInstance'
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
    { rule: [undefined, EventEnums.InstanceType.EventConnection] }
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
    _connectionPriorities,
    _connectionPriorityOrder: _cpo,
    settings: { linkedEvents }
  } = event;

  let {
    _pausePriority
  } = event;

  const _signature = {
    ...caller.settings,
    ...signature
  }

  /*
    @todo: find better solution for handing special case for loop

    The goal here is to start at the end of the connection list
    and finish before the _pausePriority (while i > _pausePriority). 
    However, in the case where the event state is listening, the
    for loop should iterate over all connections (while i >= _pausePriority)

    For now, a temporary solution is to give the for loop an extra
    iteration by subtracting 1 from the _pausePriority if the event
    state is listening. if the event state is paused then don't
    subtract anything.

    I'm not fond of this solution but this is a very small and
    localized issue that shouldn't scale so this is fine for now.
  */

  // @note: don't change _pausePriority here if it needs to be used anywhere else in this function
  if (!event.validateDispatch({ isListening: () => _pausePriority-- })) {
    return;
  }

  caller._propagating = true;

  for (let i = _cpo.length - 1; i > _pausePriority; i--) {
    const connectionRow = _connectionPriorities[_cpo[i]];
    const connectionList = connectionRow.connections;

    for (let j = 0; j < connectionList.length; j++) {
      const connection = connectionList[j];
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
          // continuePropagation: doesn't set _propagating to false after firing other branched events
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

  // not necessary to set _propagating back to false but helps for readability in the console
  // _propagating will remain true if continuePropagation is enabled and a parent event exists
  caller._propagating = Boolean(_signature.continuePropagation) && event._parentEvent;
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

  /*
    connectionRow = {orderIndex: 0, connections: [...]}
  */
  let connectionRow = _connectionPriorities[priority];
  let connectionList;

  const connection = {
    _customType: EventEnums.InstanceType.EventConnection,
    _priority: priority,
    _active: true,
    ...connectionData
  };

  // self reference for filtering
  connection.connectionInstance = connection;

  // creating a new connection priority list if one doesn't exist
  if (!connectionRow) {
    connectionList = [];
    connectionRow = {
      orderIndex: _cpo.length, 
      connections: connectionList
    };

    _connectionPriorities[priority] = connectionRow;
    _cpo.push(priority);

    // sort connection priority indices
    if (_cpo.length > 1) {
      for (let now = _cpo.length - 1; now > 0; now--) {
        const last = now - 1;

        if (_cpo[now] < _cpo[last]) {
          const lastRow = _connectionPriorities[_cpo[last]];

          // swap order index then swap places
          [connectionRow.orderIndex, lastRow.orderIndex] = [lastRow.orderIndex, connectionRow.orderIndex];
          [_cpo[last], _cpo[now]] = [_cpo[now], _cpo[last]];

        } else {
          break;
        }
      }
    }
  } else {
    connectionList = connectionRow.connections;
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
  const [
    connectionName, 
    handlerFunction, 
    connectionInstance
  ] = filterConnectionArgs(...args);

  return this.disconnectWithPriority(0, { 
    name: connectionName, 
    handler: handlerFunction, 
    connectionInstance: connectionInstance 
  })
}

const disconnectWithPriority = function(priority, connectionData = {}) {
  priority = getPriority(priority);
  const { _connectionPriorities, _connectionPriorityOrder: _cpo } = this;

  /*
    special case: if connection object is passed instead of a name or handler function
    then disconnect the connection instance
  */
  const {
    name: connectionName,
    handler: handlerFunction,
    connectionInstance
  } = connectionData;

  if (connectionInstance) {
    const connectionList = this._connectionPriorities[connectionInstance._priority].connections;
    /*
      @todo: look into alternative method for removing connection instances.
      `splice` combined with `findIndex` makes this somewhat costly.
    */
    connectionList.splice(
      connectionList.findIndex(conn => conn === connectionInstance),
      1
    );

    return;
  }

  // disconnect based on connection name or handler function criteria
  const isEligibleForDisconnect = connection => {
    return objectMeetsCriteria(connection, [
      { key: 'name', equals: connectionName, ignoreUndefined: true },
      { key: 'handler', equals: handlerFunction, ignoreUndefined: true },
    ]); 
  }

  const priorityIndex = _connectionPriorities[priority]?.orderIndex;

  /* 
    @todo: maybe handle this differently in the future to allow disconnecting with 
    priority numbers that haven't been created yet?
  */
  if (!priorityIndex) throw 'No such priority number exists';

  for (let i = 0; i <= priorityIndex; i++) {
    const connectionRow = _connectionPriorities[_cpo[i]];
    const connectionList = connectionRow.connections;

    for (let j = connectionList.length - 1; j >= 0; j--) {
      const connection = connectionList[j];
      if (isEmpty(connectionData) || isEligibleForDisconnect(connection)) {
        connectionList.splice(j, 1);
      }
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
  return this._state !== EventEnums.StateType.Disabled;
}


/*
  validateDispatch({ 
    isDisabled: () => if event is disabled
    noConnection: () => no connections exist
    dispatchLimitReached: () => event dispatch limit is reached,
    isListening: () => event is listening,
    hasPriorityDiff: () => event is paused but has available connections of higher priority
  });
*/
const validateDispatch = function(caseHandler = {}) {
  const { 
    _connectionPriorityOrder: _cpo, 
    _pausePriority,
    _state,
    settings: { dispatchLimit },
    stats: { 
      timeLastDispatched,
      dispatchCount
    },
  } = this;

  const highestPriority = _cpo[_cpo.length - 1];

  const handleCase = (cause, ...args) => {
    if (caseHandler[cause]) {
      caseHandler[cause](...args);
    }
  }

  /*
    Begin case-checking 
  */

  // event has been disabled
  if (!this.isEnabled()) {
    handleCase('isDisabled');
    return false;
  }

  // connections list is empty; no connections exist
  if (_cpo.length === 0) {
    handleCase('noConnection');
    return false;
  }

  // event exceeded dispatch limit set by user
  if (dispatchCount >= dispatchLimit) {
    handleCase('dispatchLimitReached');
    return false;
  }

  // event is in listening state
  if (_state === EventEnums.StateType.Listening) {
    handleCase('isListening');
    return true;
  }
  
  // event state is paused but higher connection priorities exist
  if (highestPriority > _pausePriority) {
    handleCase('hasPriorityDiff');
    return true;
  }

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
    { rule: [parentEvent, EventEnums.InstanceType.EventInstance] },
    { rule: [settings, 'object'], default: {} }
  ]);

  const event = {
    // event fields
    _customType: EventEnums.InstanceType.EventInstance,
    _parentEvent: parentEvent,
    /* 
      _connectionPriorityOrder: [0, 3, 5]
      _connectionPriorities: { 
        ['5']: {orderIndex: 2, connections: []},
        ['0']: {orderIndex: 0, connections: []},
        ['3']: {orderIndex: 1, connections: []},
      }

    */
    _connectionPriorityOrder: [],
    _connectionPriorities: {},
    _childEvents: [],
    _propagating: false,

    _pausePriority: 0,
    _state: EventEnums.StateType.Listening, // listening | paused:priority_1 | disabled

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
    disconnectWithPriority,
    disconnectAll,
    pause,
    resume,
    validateDispatch,
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

