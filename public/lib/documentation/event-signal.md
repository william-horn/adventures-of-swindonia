
# Event Maker

## Connecting Event Signals

Given the initial set-up process:
```js
const event = EventSignal.event();

const onEventFired = function() {
  console.log('event fired!');
}
```

You can create event signals as such:
```js
event.connect( onEventFired );
event.connect( 'signalName', onEventFired );

EventSignal.event().connect( onEventFired );
```


## Firing Event Signals

```js
const event = EventSignal.event();

event.connect( 
  (...args) => console.log('event fired with args: ', ...args) 
);

event.fire();
event.fire(1, 'foo', false);
```
##
    => event fired with args:
    => event fired with args: 1 foo false


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