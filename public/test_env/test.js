const {modelArgs, modelArgs_beta, objectValuesAreUndefined} = require('../../lib/helpers');
const inspect = require('util').inspect;
const { Event, EventEnums, dispatchEvent } = require('../lib/event-maker');

const show = obj => console.log(inspect(obj, {showHidden: false, depth: null, colors: true}));

const parent = Event();
const event = Event(parent);

parent.connect(() => console.log('parent fired'));
event.connect(() => console.log('fired event 1'));

dispatchEvent({
  event,
  args: ['a', 'b', 'c'],
  /*
    headers: {
      ghost: true,
      bubbling: true,
      ignoreLinkedEvents: true,
      trickle: true
      dispatchOrder: ['self', 'linked', 'trickle', 'bubble'],
    }
  */
  extensions: {
    // ghost: true,
    // bubbling: true
  },
});

// const greatGrandparentEvent = Event();
// const grandParentEvent = Event(greatGrandparentEvent, { grandparent: true });
// const parentEvent = Event(grandParentEvent, { bubbling: true, dispatchLimit: 500, x: 9 });
// const childEvent = Event(parentEvent, { bubbling: true, dispatchLimit: 2 });

// grandParentEvent.connect(() => console.log('grandpa fired'));
// childEvent.connect('name1', () => console.log('CHILD event with prio 0'));
// parentEvent.connect('name1', () => console.log('PARENT event 1'));
// grandParentEvent.connect('name2', () => console.log('GRANDPARENT event 2'));
// greatGrandparentEvent.connect('name3', () => console.log('GREATGRANDPARENT event 3'));
// const c = childEvent.connectWithPriority(3, { handler: (e) => console.log('CHILD event with prio 3', e.hello) });
// childEvent.connectWithPriority(5, { handler: (e) => {console.log('CHILD event with prio 5'); e.hello='sup'} });
// parentEvent.connect(() => console.log('PARENT event fired'));


// childEvent.setGhost();
// parentEvent.setGhost();
// childEvent.fire();
// childEvent.fire();
// show(childEvent);

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
