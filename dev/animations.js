import Sprites from './sprites.js';
import { World } from './engine/world.js';

let context = document.getElementById('ctx').getContext('2d');

context.imageSmoothingEnabled = false;

let sprites = null;

let current_animation = 1085;//1077;
let mainLoopRequest = 0;
let mainLoopTimeoutID = 0;

let zoom = 1.0;
let originX = 50;
let originY = 50;

function stopAnimation() {
  window.cancelAnimationFrame(mainLoopRequest);
  clearTimeout(mainLoopTimeoutID);
  mainLoopRequest = 0;
  mainLoopTimeoutID = 0;
}

function mainLoop(elapsedTime) {

  // request next frame
  let mainLoopRequest = window.requestAnimationFrame((t) => { 
    mainLoopTimeoutID = setTimeout(mainLoop, 160);
  });


  // animation is invalid, move to next
  if (!sprites.isAnimationValid()) {
    console.log("animation "+sprites.animationIndex+" is invalid");
    sprites.setAnimation(current_animation++);
    return;
  }

  let r = context.canvas.getBoundingClientRect();
  context.clearRect(0, 0, r.width, r.height);

  let sprite = sprites.currentFrame;
  
  if (!sprite) {
    console.log("Can't find sprite");
    stopAnimation();
    return;
  }


  // draw a reference box
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.strokeRect(50*zoom, 50*zoom, 50*zoom, 50*zoom);

  // draw sprite
  sprites.draw(context, { x: originX, y: originY }, zoom, sprite, 0);
  sprites.draw(context, { x: originX, y: originY }, zoom, sprite, 1);
  // sprites.draw(context, { x: originX, y: originY }, zoom, sprite, 2);

  // show status
  let statusText = 'animation #'+current_animation+' frame: '+(sprites.nextFrame + 1)+'/'+sprites.totalFrames+' #'+sprites.currentFrameIndex+" size: "+sprite.frame.w+"x"+sprite.frame.h+" "+sprite.sourceSize.w+"x"+sprite.sourceSize.h;
  context.font = '14px serif';
  context.fillText(statusText, 10, r.height - 10);

  // advance animation
  if (sprites.advance()) {
    // sprites.setAnimation(current_animation++);
  }
};

window.addEventListener('mousedown', (e) => {
  let r = context.canvas.getBoundingClientRect();
  let x = e.clientX - r.x;
  let y = e.clientY - r.y;

  originX = x / zoom;
  originY = y / zoom;
});

window.addEventListener('keydown', (e) => {
  if (e.code == 'Space') {
    sprites.setAnimation(current_animation++);
    console.log('next animation '+current_animation);
  } else if (e.code == 'Escape') {
    console.log(e);
    stopAnimation();
  }
});

window.onload = async function (){

  // setup world for sprite rendering
  World.tileDepth = 16;
    
  sprites = await Sprites.loadFromFile('./assets/sprites');
  sprites.setAnimation(current_animation);

  mainLoop(0);
}
