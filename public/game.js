
const { Vector3 } = require('@math.gl/core');
const { thing } = require('./lib/util');

const v1 = new Vector3(1, 1, 1);
const v2 = new Vector3(2, 2, 2);

console.log(v1.add(v2));
console.log(thing);
