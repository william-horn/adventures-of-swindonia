const {modelArgs, modelArgs_beta} = require('../../lib/helpers');
const inspect = require('util').inspect;
const { Event } = require('../lib/event-maker');

const show = obj => console.log(inspect(obj, {showHidden: false, depth: null, colors: true}));

const parentEvent = Event();
const childEvent = Event(parentEvent, { bubbling: true, dispatchLimit: 4, linkedEvents: [parentEvent] });
childEvent.connectWithPriority(4, { handler: () => {} });
childEvent.connect(() => console.log('event with prio 0'));
childEvent._pausePriority = 6;

const cond = childEvent.validateNextDispatch({
  ready: state => console.log('ready: ', state),
  rejected: state => console.log('not ready: ', state)
});

parentEvent.connect(() => console.log('parent event fired'));

childEvent.fire();

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

// func1('str1', 500, 'str2', 1, 'str3'); // str, str, boolean, str, num
