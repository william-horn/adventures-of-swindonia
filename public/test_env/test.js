const {modelArgs, modelArgs_beta} = require('../../lib/helpers');
const { event } = require('../lib/event-maker');

const parentEvent = event();
const childEvent = event(parentEvent);
const child2Event = event(parentEvent);
const subchildEvent = event(child2Event);

const handler1 = () => console.log('handler #1 fired');
const handler2 = () => console.log('handler #2 fired');
const handler3 = () => console.log('handler #3 fired');

parentEvent.connect( handler1 );
childEvent.connect( handler2 );
child2Event.connect( 'someName', handler3 );
subchildEvent.connect( handler3 );

parentEvent.disconnectAll({});
parentEvent.fireAll();

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
