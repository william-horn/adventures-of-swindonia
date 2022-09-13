const {modelArgs, modelArgs_beta} = require('../../lib/helpers');
const { Event } = require('../lib/event-maker');

const testEvent = Event();

const handler = (e) => console.log('handler ran', e.poop);
const handler2 = (e) => {e.poop = 'butt'; console.log('handler ran')};

testEvent.connect('someName', handler);
testEvent.connectWithPriority(4, { name: 'anotherName', handler2 });
testEvent.connectWithPriority(2, { name: 'yetAnother', handler });
testEvent.connectWithPriority(7, { name: 'tom', handler });
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
