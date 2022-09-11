
# EventMaker Documentation

The `EventMaker` library was a side project developed by [William J. Horn](https://github.com/william-horn) during the development of an online browser game called **Adventures of Swindonia**. It is intended to make dealing with *user input*, *event delegation*, *event sequencing*, *asynchronous programming*, and *user control* much easier.

## FAQ

- What Technologies are Involved?
  * **None**. Everything is written in native JavaScript.

* Does it Handle User Input?
  - Yes.

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
  event,
  toggleEvent,
  sequenceEvent
} = require('EventMaker');
```
or with ES6
```js
import {
  event,
  toggleEvent,
  sequenceEvent
} from 'EventMaker';
```

## Event Instantiation
An event can be spawned (instantiated) by simply calling the `event` constructor from the `EventMaker` library
```js
const event = EventMaker.event();
```

The `event` constructor takes two arguments; both are optional. Arguments listed in order:
- `parentEvent` &lt;Event Instance>
  * Another event instance which will now contain the new instantiated event inside the `childEvents` field. Behavior affecting the parent event can ripple down to child and descendant events.

* `settings` &lt;Object>
  - The settings object contains all additional config data about the event and how it will behave. For now, there is only one field in the settings object that is configurable which is the `cooldown` property.


Here is a hierarchy of event instances using the `parentEvent` argument in the `event` constructor:

```js
const grandparent = EventMaker.event();
const parent = EventMaker.event(grandparent);
const child = EventMaker.event(parent);
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
  
When an event is fired, only the connections made to that event will dispatch. The signal will not trickle down to child events unless it is dispatched using `fireAll`.

## Connecting Events

Events are only useful if they have connections. You can create a new event connection by calling the `connect` method on the event instance. 

The `connect` method takes two arguments; one is optional. Arguments listed in order:

> *Optional arguments are denoted with the '?' symbol next to their name*

* `connectionName`? &lt;String>
  - Only needed if you intend on disconnecting or filtering events by name later on. If no name is given, the event connection is considered anonymous.

- `handlerFunction` &lt;function>
  * The handler function that executes when the event is dispatched.

Below are some examples of creating event connections using a variation of arguments:

```js
const event = EventMaker.event();

const eventHandler = function() {
  console.log('event was fired!');
}

// anonymous connection
event.connect( eventHandler );

// named connection
event.connect( 'someHandler', eventHandler );
```


## Dispatching Events

In the `EventMaker` library, events are dispatched by using the `fire` and `fireAll` methods. The difference between the two are highlighted below:

* `fire(...args)`
  - Dispatch all event connections established on that event. Does **NOT** trickle downward to child events (if any exist).

- `fireAll(...args)`
  * Dispatch all event connections established on that event **INCLUDING** all connections established on all children and descendant events.


For now we will just focus on the `fire` method, as this is the core function behind dispatching events. 

> *Behind the scenes, `fireAll` is just a recursive call to `fire` for all child events*
```js
// create event instance
const event = EventMaker.event();

// create event connection
event.connect( () => console.log('event fired!') );

// dispatch the event
event.fire();
```
##
    => event fired!

You may also pass any number of arguments to the dispatcher methods. This means you can include parameters to your event handler functions if you would like to receive some data from your dispatcher. 

Example:
```js
const event = EventMaker.event();

event.connect( 
  (a, b, c) => console.log('event fired with args: ', a, b, c) 
);

// dispatch the event with args
event.fire('hello', 'there', 'world!');
```
##
    => hello there world!
## Waiting for Event Signals
The code below demonstrates how we can "pause" code execution using `event.wait()` until the event is fired with `event.fire()`. The waiting is promise-based, therefore all tasks waiting for an event to be fired should be done within an async function.
```js
const event = EventSignal.event();
event.connect(() => console.log('event fired!'));

const eventWaiter = async () => {
  while (true) {
    const yieldResult = await event.wait();
    const dateTime = yieldResult[0]; // 1662869075619
  }
}

eventWaiter();
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