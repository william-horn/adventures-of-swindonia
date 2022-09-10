
// game config vars
const { 
  getWidth: getGameWidth, 
  getHeight: getGameHeight 
} = require('./config/game-settings');

// library imports
const {
  vec3,
  vec2
} = require('./lib/math-gl-proxy');

// globals
const gameCanvas = document.getElementById('gameWindow');
const ctx = gameCanvas.getContext('2d');

const gameState = {

}

const updateGameCanvasSize = () => {
  gameCanvas.width = getGameWidth();
  gameCanvas.height = getGameHeight();
}

// initialization
const gameStep = timestamp => {
  ctx.fillRect(0, 0, 100, 50);

  // next frame
  window.requestAnimationFrame(gameStep);
}



// set initial states
updateGameCanvasSize();

// initialize event listeners
window.addEventListener('resize', updateGameCanvasSize);

// start game loop
window.requestAnimationFrame(gameStep);
