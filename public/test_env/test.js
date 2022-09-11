
// const EventSignal = require('../lib/event-signal');
// const event = EventSignal.event();

// event.test();

const { EventSignal } = require('../lib/event-signal');

const event = EventSignal.event()
;
const f = () => {}
event.connect(f, 'lol');

console.log(event);

