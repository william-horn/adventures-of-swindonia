
const mathgl = require('@math.gl/core');

module.exports = {
  vec3: (x, y, z) => (new mathgl.Vector3(x, y, z)),
  vec2: (x, y) => (new mathgl.Vector2(x, y)),
  ...mathgl
}