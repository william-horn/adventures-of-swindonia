const {modelArgs, modelArgs_beta, objectValuesAreUndefined} = require('../../lib/helpers');
const inspect = require('util').inspect;
const { Event, EventEnums } = require('../lib/event-maker');

const show = obj => console.log(inspect(obj, {showHidden: false, depth: null, colors: true}));

const grandParentEvent = Event()
const parentEvent = Event(grandParentEvent, { bubbling: true });
const childEvent = Event(parentEvent, { bubbling: true, dispatchLimit: 4 });

grandParentEvent.connect(() => console.log('grandpa fired'));
childEvent.connect('name1', () => console.log('CHILD event with prio 0'));
const c = childEvent.connectWithPriority(3, { handler: (e) => console.log('CHILD event with prio 3', e.hello) });
childEvent.connectWithPriority(5, { handler: (e) => {console.log('CHILD event with prio 5'); e.hello='sup'} });
parentEvent.connect(() => console.log('PARENT event fired'));


// childEvent.setGhost();
// parentEvent.setGhost();
childEvent.fireAll();

// const event = Event();
// const handler = () => console.log('event handler fired');

// event.connect('frank', handler);
// const c = event.connect(() => console.log('event fired 2'));
// event.disconnectWithPriority(0, { name: 'frank' });
// event.fire();


// (async () => {
//   console.log('waiting for event...');
//   try {
//     const results = await event.wait(6);
//     console.log('results: ', results);
//     console.log('event waiting stopped');
//   } catch(err) {
//     console.log(err);
//   }
// })();

// setTimeout(() => {
//   event.fire(1, 2, 3);
// }, 2000);

// event.fire(1,2,3);
// show(event);

// parentEvent.disconnectAllWithPriority(3)
// parentEvent.fire();
// childEvent.fire();

// (async () => {
//   const results = await parentEvent.wait();
// })()

// show(testEvent);


// show(testEvent);

// testEvent.fire();

// const func1 = (a, b, c, d, e) => {
//   [a, b, c, d, e] = modelArgs_beta([
//     {rule: [a, 'string']},
//     {rule: [b, 'string']},
//     {rule: [c, 'boolean', {string: 677}], default: 'asd'},
//     {rule: [d, 'string']},
//     {rule: [e, 'number']}
//   ]);

//   console.log(a, b, c, d, e);
// }

// const func1 = (...args) => {
//   [a, b, c, d, e] = modelArgs_beta([
//     {rule: ['string']},
//     {rule: ['string']},
//     {rule: ['boolean', {string: 677}], default: 'asd'},
//     {rule: ['string']},
//     {rule: ['number']}
//   ], ...args);

//   console.log(a, b, c, d, e);
// }


// func1('str1', 500, 'str2', 1, 'str3'); // str, str, boolean, str, num
