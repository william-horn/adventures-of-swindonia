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

Some features include:

  * Event bubbling
  * Event toggling
  * Dispatch validation
  * Creating event sequences (coming soon)
  * Creating event priorities
  * Built-in cooldown/interval handling in options
  * more coming soon

Documentation can be found here: https://github.com/william-horn/adventures-of-swindonia/blob/develop/public/lib/documentation/event-maker.md

@changelog
  [09-13/2022]
    - Removed event states "Listening" and "Paused" and replaced them with _pausePriority. 
      If _pausePriority === -1 then the state is assumed to be "Listening", otherwise if
      _pausePriority > -1 then the state is assumed to be "Paused".

    - connectWithPriority now defaults it's priority number to 1 if no priority is given.

==================================================================================================================================

@todo
========
| TODO |
==================================================================================================================================

todo: add event yielding (promise-based awaiting for event dispatches)
  * DONE - 09/14/2022
todo: create constructor for event sequences (events for sequential event dispatches, like key combinations)
todo: implement pause/resume mechanic for events
todo: implement event connection strength/priorities
  * DONE - 09/13/2022
todo: add error handling and centralize error messages

==================================================================================================================================
*/

/*
  Helper functions
*/
const {
  modelArgs_beta,
  objectMeetsCriteria,
  toUpperCamelCase,
  objectHasNoKeys,
  objectValuesAreUndefined
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
  },

  // ConnectionFilters: {
  //   Name: 'name',
  //   Handler: 'handler',
  // }
}

const getPriority = (priority, disableException) => {
  const _priority = typeof priority === 'number' ? priority
    : typeof priority === 'string'
      && EventEnums.ConnectionPriority[toUpperCamelCase(priority)];

  if (typeof _priority === 'undefined' && !disableException) throw 'Invalid priority';

  return _priority;
}

const isConnectionType = connection => {
  return typeof connection === 'object' 
    && connection._customType === EventEnums.InstanceType.EventConnection;
}

/*
  find connection list and connection index of a given connection
*/
const findConnectionInstance = (connection, _connectionPriorities) => {
  if (connection) {
    const connectionList = _connectionPriorities[connection._priority].connections;

    return { 
      list: connectionList, 
      index: connectionList.findIndex(conn => conn === connection)
    };
  }

  return false;
}

const connectionPassesFilter = (connection, connectionFilter) => {
  return objectMeetsCriteria(connection, [
    { key: 'name', equals: connectionFilter.name, ignoreUndefined: true },
    { key: 'handler', equals: connectionFilter.handler, ignoreUndefined: true },
  ]); 
}

const arrangeConnectionFilterArgs = connectFilter => {
  [
    connectFilter.name,
    connectFilter.handler,
    connectFilter.connection
  ] = modelArgs_beta([
    { rule: ['string'] }, 
    { rule: ['function'] }, 
    { rule: [EventEnums.InstanceType.EventConnection] }
  ], ...Object.values(connectFilter)); // ...args: name, handler, connection
}

const getPriorityHandlerArgs = function(priority, connectionFilter) {
  return modelArgs_beta([
    { rule: ['number', {string: getPriority(priority, true)}], default: 1},
    { rule: ['object'], default: {}}
  ], priority, connectionFilter);
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
      extensions?<object> {
        bubbling?<boolean>,
        continuePropagation?<boolean>
      }
    }

  @param ...args<any>
    The rest of the arguments passed by the user
      
  @returns <void>
*/
const dispatchEvent = function(payload, ...args) {
  const { 
    event, 
    caller, 
    extensions = {},
  } = payload;

  const {
    _connectionPriorities,
    _connectionPriorityOrder: _cpo,
    _pausePriority,
    _resolvers,
    settings: { linkedEvents, ghost },
    stats
  } = event;

  const _extensions = {
    ...caller.settings,
    ...extensions
  }

  if (!event.validateNextDispatch()) {
    return;
  }

  caller._propagating = true;
  stats.dispatchCount++;

  // if event isn't ghosted then fire self connections
  if (!ghost) {

    for (let i = _cpo.length - 1; i > _pausePriority; i--) {
      const connectionRow = _connectionPriorities[_cpo[i]];
      const connectionList = connectionRow.connections;

      for (let j = 0; j < connectionList.length; j++) {
        const connection = connectionList[j];
        connection.handler(caller, ...args);
      }
    }

  }

  // fire all waiting resolvers
  for (let i = 0; i < _resolvers.length; i++) {
    const [resolver, timeoutId] = _resolvers[i];

    if (timeoutId) clearInterval(timeoutId);

    resolver([...args]);
    _resolvers.splice(i, 1);
  }

  if (linkedEvents.length > 0) {
    for (let i = 0; i < linkedEvents.length; i++) {
      const linkedEvent = linkedEvents[i];
      dispatchEvent({
        event: linkedEvent,
        caller: caller,
        extensions: { 
          // continuePropagation: doesn't set _propagating to false after firing other branched events
          continuePropagation: true,
          // bubbling: linkedEvent.settings.bubbling
        }
      }, ...args);
    }
  }

  if (_extensions.bubbling && event._parentEvent && caller._propagating) {
    dispatchEvent({
      caller: event,
      event: event._parentEvent,
      extensions: _extensions,
    }, ...args);

  }

  // not necessary to set _propagating back to false but helps for readability in the console
  // _propagating will remain true if continuePropagation is enabled and a parent event exists
  // todo: reduce logic here for computing _propagating state
  caller._propagating = (_extensions.continuePropagation && event._parentEvent) || true;
}


const recursiveDispatch = (payload, ...args) => {
  const {
    headers = {
      // deferBubbling<boolean>
    },
    dispatchPayload,
  } = payload;

  const recurse = nextEvent => {
    const childEvents = nextEvent._childEvents;

    for (let i = 0; i < childEvents.length; i++) {
      const event = childEvents[i];

      dispatchEvent({
        event,
        caller: dispatchPayload.caller,
        extensions: {
          bubbling: false
        }
      }, ...args);

      recurse(event);
    }
  }

  // @todo: this is a super ugly solution, remember to do something about this
  dispatchEvent({
    ...dispatchPayload, 
    extensions: {
      ...dispatchPayload.extensions,
      bubbling: !headers.deferBubbling
    }
  }, ...args);

  recurse(dispatchPayload.event);

  dispatchEvent({ 
    ...dispatchPayload, 
    extensions: {
      ghost: true,
      bubbling: headers.deferBubbling
    }
  }, ...args);
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
const connect = function(...args) {
  const [name, handler] = modelArgs_beta([
    { rule: ['string'] },
    { rule: ['function', {string: () => name}] }
  ], ...args);

  return this.connectWithPriority(0, { 
    name, 
    handler 
  });
}

const connectWithPriority = function(priority, connectionData) {
  [priority, connectionData] = getPriorityHandlerArgs(priority, connectionData);
  const { _connectionPriorities, _connectionPriorityOrder: _cpo } = this;
  
  if (!connectionData) throw 'Connect method requires connection data';

  /*
    connectionRow = {orderIndex: number, connections: ConnectionInstance[]}
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

  @bug: currently fireAll() won't bubble upward because it temporarily disables bubbling
  to avoid an infinite event loop
*/
const fireAll = function(...args) {
  recursiveDispatch({
    headers: {
      deferBubbling: true
    },
    dispatchPayload: {
      event: this,
      caller: this,
    }
  }, ...args);
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
  @todo: come back and see if we can shorten the params to ...args
*/
const disconnect = function(name, handler) {
  return this.disconnectWithPriority(0, name && { name, handler })
}

const disconnectWithPriority = function(priority, connectionFilter) {
  const disconnectOverride = !connectionFilter;
  const { _connectionPriorities, _connectionPriorityOrder: _cpo } = this;
  [priority, connectionFilter] = getPriorityHandlerArgs(priority, connectionFilter);

  // connectionFilter is defined with keys: { name, handler, connection } from this point on
  arrangeConnectionFilterArgs(connectionFilter);
  const filterIsPopulated = !objectValuesAreUndefined(connectionFilter);

  // handle special case where connection instance is given
  const connectionInstanceData = findConnectionInstance(connectionFilter.connection, _connectionPriorities);
  if (connectionInstanceData) {
    connectionInstanceData.list.splice(connectionInstanceData.index, 1);
    return;
  }

  const priorityIndex = _connectionPriorities[priority]?.orderIndex;

  /* 
    @todo: maybe handle this differently in the future to allow disconnecting with 
    priority numbers that haven't been created yet?

    @todo: if using disconnectAllWithPriority, don't throw an exception because it has to be called recursively.
    otherwise, maybe throw exception.
  */
  // if (typeof priorityIndex === 'undefined') throw 'No such priority number exists';
  if (typeof priorityIndex === 'undefined') return;

  for (let i = 0; i <= priorityIndex; i++) {
    const connectionRow = _connectionPriorities[_cpo[i]];
    const connectionList = connectionRow.connections;

    for (let j = connectionList.length - 1; j >= 0; j--) {
      const connection = connectionList[j];
      if (disconnectOverride || filterIsPopulated && connectionPassesFilter(connection, connectionFilter)) {
        // console.log('disconnectOverride: ', disconnectOverride, ' | passed filter: ', connectionPassesFilter(connection, connectionFilter));
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

const disconnectAllWithPriority = function(...args) {
  this.disconnectWithPriority(...args);
  recurse(this._childEvents, 'disconnectAllWithPriority', ...args);
}

const wait = function(timeout) {
  return new Promise((resolve, reject) => {
    const resolver = [resolve];

    if (timeout !== undefined) {
      resolver[1] = setTimeout(
        () => reject('Event timed out'), 
        timeout*1000
      );
    }

    this._resolvers.push(resolver);
  });
}


const pause = function(...args) {
  const [name, handler, connection] = getConnectionFilterArgs(...args);

  return this.pauseWithPriority(0, {
    name,
    handler,
    connection
  });
}

const pauseAll = function(...args) {
  this.pause(...args);
  recurse(this._childEvents, 'pauseAll', ...args);
}

const pauseWithPriority = function(priority, connectionFilter = {}) {
  [priority, connectionFilter] = getPriorityHandlerArgs(priority, connectionFilter);
  const { _connectionPriorities, _connectionPriorityOrder: _cpo } = this;


}

const pauseAllWithPriority = function() {

}

const resume = function() {

}

const resumeAll = function() {

}

const resumeWithPriority = function() {

}

const resumeAllWithPriority = function() {

}

const isEnabled = function() {
  return this._state !== EventEnums.StateType.Disabled;
}

const isListening = function() {
  return this._pausePriority === -1;
}

const setGhost = function() {
  this.settings.ghost = true;
}

const unsetGhost = function() {
  this.settings.ghost = false;
}

/*
  validateNextDispatch({ 
    ready: (state) => {
      if (state === 'allListening')
      else if (state === 'priorityListening') 
    },

    rejected: (state) => {
      if (state === 'isDisabled')
      else if (state === 'noConnection') 
      else if (state === 'priorityPaused')
      else if (state === 'dispatchLimitReached')

    }
  });
*/
const validateNextDispatch = function(caseHandler = {}) {
  const { 
    _connectionPriorityOrder: _cpo, 
    _pausePriority,
    settings: { dispatchLimit, ghost },
    stats: { 
      timeLastDispatched,
      dispatchCount
    },
  } = this;

  const highestPriority = _cpo[_cpo.length - 1];

  const sendStatus = (status, ...args) => {
    if (caseHandler[status]) caseHandler[status](...args)
  }

  /*
    Begin case-checking 
  */

  // event has been disabled
  if (!this.isEnabled()) {
    sendStatus('rejected', 'isDisabled');
    return false;
  }

  if (this.ghost) {
    sendStatus('ready', 'isGhost');
    return true;
  }

  // connections list is empty; no connections exist
  if (_cpo.length === 0) {
    sendStatus('rejected', 'noConnection');
    return false;
  }

  // all connections are paused
  if (_pausePriority >= highestPriority) {
    sendStatus('rejected', 'priorityPaused');
    return false;
  }

  // event exceeded dispatch limit set by user
  if (dispatchCount > dispatchLimit) {
    sendStatus('rejected', 'dispatchLimitReached');
    return false;
  }

  // event is in listening state
  if (this.isListening()) {
    sendStatus('ready', 'allListening');
    return true;
  }
  
  // event state is paused but higher connection priorities exist
  if (highestPriority > _pausePriority) {
    sendStatus('ready', 'priorityListening');
    return true;
  }
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
    _resolvers: [],
    _propagating: false,

    _pausePriority: -1,
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
      ghost: boolean
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
    disconnectAllWithPriority,
    pause,
    pauseAll,
    pauseWithPriority,
    pauseAllWithPriority,
    resume,
    resumeAll,
    resumeWithPriority,
    resumeAllWithPriority,
    validateNextDispatch,
    wait,
    isEnabled,
    isListening,
    setGhost,
    unsetGhost,
    stopPropagating
  }

  // add the new event instance to the parent event's child-event list
  if (parentEvent) parentEvent._childEvents.push(event);

  return event;
}

module.exports = {
  Event,
  EventEnums,
  getPriority,
  isConnectionType
}

