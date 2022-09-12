
// const EventMaker = require('../lib/event-maker');

// const parentEvent = EventMaker.event();
// const childEvent = EventMaker.event(parentEvent);
// const child2Event = EventMaker.event(parentEvent);
// const subchildEvent = EventMaker.event(child2Event, { linked: [child2Event] });





// const handler1 = () => console.log('handler #1 fired');
// const handler2 = () => console.log('handler #2 fired');
// const handler3 = () => console.log('handler #3 fired');

// parentEvent.connect( handler1 );
// childEvent.connect( handler2 );
// child2Event.connect( 'someName', handler3 );
// subchildEvent.connect( handler3 );

// subchildEvent.fire();


const {modelArgs, modelArgsBeta} = require('../../lib/helpers');

const funca = (name, func) => {

  // [arr, obj] = modelArgs([
  //   [arr, 'array', {object: obj || []}],
  //   [obj, 'object', {undefined: arr || {}}]
  // ]);

  // console.log(arr, obj);

  // [arr, obj] = modelArgsBeta([
  //   [arr, 'array', {undefined: []}],
  //   [obj, 'object', {undefined: {}}]
  // ]);

  // [arr, obj] = modelArgsBeta([
  //   {rule: [arr, 'array'], default: []},
  //   {rule: [obj, 'object', {undefined: undefined}], default: {}}
  // ]);

  [name, func] = modelArgsBeta([
    {rule: [name, 'string'], default: 'strdefault'},
    {rule: [func, 'function', {string: () => name}], default: 'def'}
  ]);

  // [arr, obj] = modelArgsBeta([
  //   {rule: [arr, 'array'. {object: 'string'}]},
  //   {rule: [obj, 'object']}
  // ]);

  console.log(name, func);
}

const arr = [1,2,3]
const obj = {a: 'a', b: 'b', c: 'c'}
const f = () => 5

funca('someString', f);
funca()
funca(f, 'someString')