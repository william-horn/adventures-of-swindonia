const {modelArgs, modelArgs_beta} = require('../../lib/helpers');
const inspect = require('util').inspect;
const { Event } = require('../lib/event-maker');

const show = obj => console.log(inspect(obj, {showHidden: false, depth: null, colors: true}));

const parentEvent = Event();
const testEvent = Event(parentEvent, { bubbling: true });

const handler = (e) => console.log('handler ran 1');
const handler2 = (e) => console.log('handler ran 2');

testEvent.connectWithPriority({ handler, name: 'bob' });
testEvent.connectWithPriority(0, { handler: () => console.log('new thing') });
testEvent.connectWithPriority(1, { handler: () => console.log('prio 1') });
// testEvent.connect(handler2);
testEvent.connectWithPriority(3, { handler: handler2 });
testEvent.connectWithPriority(2, { handler });
testEvent.fire();
testEvent.disconnectWithPriority(2, { handler });
console.log('after disconnect:');
testEvent.fire();
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

// func1('str1', 500, 'str2', 1, 'str3'); // str, str, boolean, str, num
