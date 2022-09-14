
# EventMaker Documentation

The `EventMaker` library was a side project developed by [William J. Horn](https://github.com/william-horn) during the development of an online browser game called **Adventures of Swindonia**. It is intended to make dealing with *user input*, *event delegation*, *event sequencing*, *asynchronous programming*, and *user control* much easier.

### **Important:** *documentation will probably be out of date during it's current peak developmental stages. Stay posted.*

## FAQ

- Coming soon


## Getting Started


To get started using the `EventMaker` library, simply import the file from wherever it is located in your project. CommonJS implementation:
```js
const EventMaker = require('EventMaker');
```
or with ES6
```js
import EventMaker from 'EventMaker';
```

You may also destructure upon import
```js
const {
  Event,
  ...
} = require('EventMaker');
```
or with ES6
```js
import {
  Event,
  ...
} from 'EventMaker';
```

## Event Instantiation
An event can be spawned (instantiated) by simply calling the `Event` constructor from inside the EventMaker module
```js
const event = EventMaker.Event();
```

The `Event` constructor takes two arguments; both are optional. Arguments listed in order:
- `parentEvent` **&lt;Event Instance>**
  * Another event instance which will now contain the new instantiated event inside the `childEvents` field. Behavior affecting the parent event can ripple down to child and descendant events if you use `<methodName>All()` methods.

* `settings` **&lt;Object>**
  - The settings object contains all additional config data about the event and how it will behave.


Here is a hierarchy of event instances using the `parentEvent` argument in the `Event` constructor:

```js
const { Event } = require('EventMaker');

const grandparent = Event();
const parent = Event(grandparent);
const child = Event(parent);
```
Internally, the hierarchy looks something like this:
##
    grandparent {
      ...
      childEvents {
        parent {
          ...
          childEvents {
            child {
              ...
              childEvents {}
            }
          }
        }
      }
    }
  
When an event is fired, only the connections made to that event will dispatch. The signal will not trickle down to descendant event instances unless it is dispatched using `fireAll`.

## Connecting Events

Events are only useful if they have connections. You can create a new event connection by calling the `connect` or `connectWithPriority` methods on the event instance. 

> *Internally, `connect` calls the `connectWithPriority` function passing the arguments `0, { name, handler, connectionInstance }`. If you don't need to worry about connection priorities you can just use `connect`.*

The `connect` method takes up to two arguments; one is optional. Arguments listed in order:

> *Optional arguments are denoted with the '?' symbol next to their name*

* `connectionName`? **&lt;string>**
  - Only needed if you intend on disconnecting or filtering events by name later on. If no name is given, the event connection is considered anonymous.

- `handlerFunction` **&lt;function>**
  * The handler function that executes when the event is dispatched.

Below are some examples of creating event connections using a variation of arguments:

```js
const event = Event();

const eventHandler = function() {
  console.log('event was fired!');
}

// anonymous connection
event.connect( eventHandler );

// named connection
event.connect( 'someHandler', eventHandler );
```

Events have no limit to how many connections they can have. All connections will be dispatched when the dispatcher methods are called.

## Dispatching Events

Events are dispatched by using the `fire` and `fireAll` methods. The difference between the two are highlighted below:

* `fire(...args)`
  - Dispatch all event connections established on that event. Does **NOT** trickle downward to descendant events.

- `fireAll(...args)`
  * Dispatch all event connections established on that event **INCLUDING** all connections established on all descendant events.


For now we will just focus on the `fire` method, as this is the core function behind dispatching events. 

> *Behind the scenes, `fireAll` is just a recursive call to `fire` for all descendant events*
```js
// create event instance
const event = Event();

// create event connection
event.connect( () => console.log('event fired!') );

// dispatch the event
event.fire();
```
##
    =>  event fired!

You may also pass any number of arguments to the dispatcher methods. This means you can include parameters in your event handler functions if you would like to receive some data from your dispatcher. 

Example:
```js
event.connect( 
  (a, b, c) => console.log('event fired with args: ', a, b, c) 
);

// dispatch the event with args
event.fire('hello', 'there', 'world!');
```
##
    =>  hello there world!

As mentioned before, you can create as many connections to an event instance as you like. They will all be fired once the dispatcher is called.

Example:

```js
event.connect( () => console.log('event connection #1') );
event.connect( () => console.log('event connection #2') );
event.connect( () => console.log('event connection #3') );

event.fire();
```
##
    =>  event connection #1
        event connection #2
        event connection #3

## Disconnecting Events

If you no longer need an event connection then you may disconnect it from the event instance by using the following methods:
  * `disconnect`
  * `disconnectAll` 
  * `disconnectWithPriority`
  * `disconnectAllWithPriority`
  
  You can disconnect event connections by name, handler function, or by the connection instance returned from the `connect` and `connectWithPriority` method.

  > *Internally, the `disconnect` method calls `disconnectWithPriority` with a default priority of `0`* 

The `disconnect` method takes up to three arguments; all of them are optional. Arguments listed:


* `connectionName`? **&lt;string>**
  - The name of the connection to disconnect

- `handlerFunction`? **&lt;function>**
  * The handler function literal that was passed to a `connect` method

* `connectionInstance`? **&lt;Connection Object>**
  - The connection object returned from the `connect` method


If no arguments are passed to `disconnect`, then **all** connections with `priority: 0` will be disconnected from the event instance.
```js
const event = Event();

event.connect( () => console.log('connection #1 fired!') );
event.connect( () => console.log('connection #2 fired!') );

event.disconnect(); // disconnect all connections
event.fire();
```
##
    =>  <Empty>

If you pass the `connectionInstance` as an argument, then the other two arguments are not necessary. This is because connection instances have a one-to-one relationship with event connections; meaning there will only ever be one event connection associated with a connection instance.

```js
event.connect( () => console.log('connection #1 fired!') );
const conn = event.connect( () => console.log('connection #2 fired!') );

event.disconnect(conn); // disconnect using connection instance
event.fire();
```
##
    =>  connection #1 fired!

If you pass the `connectionName` or `handlerFunction` arguments then you may pass them individually (or at the same time) in any order.

Setup:
```js
const handler1 = () => console.log('event handler #1 fired!');
const handler2 = () => console.log('event handler #2 fired!');

event.connect( handler1 );
event.connect( handler1 );
event.connect( 'someName', handler1 );
event.connect( 'anotherName', handler2 );

event.fire();
```
##
    =>  event handler #1 fired!
        event handler #1 fired!
        event handler #1 fired!
        event handler #2 fired!

### Disconnecting with `connectionName` and `handlerFunction`

```js
event.disconnect( 'someName', handler1 );
event.fire();
```
##
    =>  event handler #1 fired!
        event handler #1 fired!
        event handler #2 fired!

### Disconnecting with `handlerFunction`
```js
event.disconnect( handler1 );
event.fire();
```
##
    =>  event handler #2 fired!

### Disconnecting with `connectionName` and `handlerFunction` in reverse order:
```js
event.disconnect( handler2, 'anotherName' );
event.fire();
```
##
    =>  event handler #1 fired!
        event handler #1 fired!
        event handler #1 fired!


The `disconnectAll` method (similar to the internal behavior of `fireAll`) will recursively call `disconnect` on all descendant events.

This method takes the same arguments as `disconnect`. If no arguments are passed to `disconnectAll`, then **all** connections with `priority: 0` will be disconnected from the event instance and all of it's descendant events.

Here is a demonstration:
```js
const parentEvent = Event();
const childEvent = Event(parentEvent);

parentEvent.connect( () => console.log('parent event #1') );
childEvent.connect( () => console.log('child event #1') );

parentEvent.disconnectAll();

parentEvent.fire();
childEvent.fire();
```
##
    =>  <Empty>

Since `disconnectAll` calls `disconnect` recursively, the same argument filtering will be applied to all descendant event instances if any arguments are provided.

Here is a demonstration:
```js
const parentEvent = EventMaker.event();
const childEvent = EventMaker.event(parentEvent);

parentEvent.connect( () => console.log('parent event #1') );
childEvent.connect( 'someName', () => console.log('child event #1') );
childEvent.connect( () => console.log('child event #2') );

parentEvent.disconnectAll('someName');

// we can use fireAll() instead of individually firing the events
parentEvent.fireAll();
```
##
    =>  parent event #1
        child event #2


> *Since we created a hierarchy with `childEvent` and `parentEvent`, doing:*
```js
parentEvent.fireAll();
```
> *is the same as:*
```js
parentEvent.fire();
childEvent.fire();
```

## Waiting for Event Signals
The code below demonstrates how we can "pause" code execution using `event.wait()` until the event is fired with `event.fire()`. The waiting is promise-based, therefore all tasks waiting for an event to be fired should be done within an async function.
```js
const event = EventSignal.event();
event.connect(() => console.log('event fired!'));

const oneSecondEventIntervals = async () => {
  while (true) {
    const yieldResult = await event.wait();
    const dateTime = yieldResult[0]; // 1662869075619
  }
}

oneSecondEventIntervals();
setInterval(() => event.fire(Date.now()), 1000);
```

## Event Config Options

Creating a new event with custom options

```js
const event = EventSignal.event();
event.setCooldown(1);
```
```js
const event = EventSignal.event().setCooldown(1);
```
```js
const event = EventSignal.event(_parentEvent_, {
  cooldown: 1
});
```


## Event Sequencing

Coming soon

note: make new toggle event constructor that has `active` and `inactive` states

```js
const keyPressA = () => console.log('pressed A key!');
const keyPressB = () => console.log('pressed B key!');

const onKeyPressA = EventSignal.event()

const eventSequence = EventSignal.eventSequencer(
  { event: keyPressA, repetition: 2, hold: false },
  { event: keyPressB, repetition: 1, hold: false }
);
```


## Keyboard Example

Connecting keyboard signals
```js
const KeyboardEvent = EventSignal.event();
const KeyA = EventSignal.event(KeyboardEvent);
const KeyB = EventSignal.event(KeyboardEvent);

const onKeyboardChange = () => console.log('keyboard changed!');
const onKeyPressA = () => console.log('A was pressed!');
const onKeyPressB = () => console.log('B was pressed!');

KeyboardEvent.connect( onKeyboardChange );
KeyA.connect( onKeyPressA );
KeyB.connect( onKeyPressB );
```

Firing keyboard signals with `fire`

```js
KeyboardEvent.fire();
```
##
    => keyboard changed!

Firing keyboard signals with `fireAll`
```js
KeyboardEvent.fireAll()
```
##
    => keyboard changed!
    => A was pressed!
    => B was pressed!


## Connection Priority
```js
const event = EventMaker.event();
const handler = () => console.log('ran handler');

event.connectWithPriority('name', handler);
event.pause(1)
event.pause('*')

event.pauseAll(1)

```
