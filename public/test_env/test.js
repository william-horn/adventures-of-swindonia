
const EventMaker = require('../lib/event-maker');
const event = EventMaker.event();

event.connect( 'frank', () => console.log('connection #1 fired!') );
const conn = event.connect( () => console.log('connection #2 fired!') );
event.connect( 'frank', () => console.log('connection #3 fired!') );
event.connect( 'frank2', () => console.log('connection #4 fired!') );
event.connect( 'frank', () => console.log('connection #5 fired!') );

console.log(event);

event.fire();
event.disconnect(conn);
event.disconnect('frank');
console.log('after disconnect:');
event.fire();


// const { 
//   event,
//   sequenceEvent,
//   toggleEvent
// } = require('EventMaker');
// const EventMaker = require('EventMaker');

