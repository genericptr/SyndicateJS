/**
 * sprites.js
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

import { World} from './engine/world.js';

export default class Sprites {

  constructor(data) {
    this.data = data;
  }

  get currentAnimation() { return this.animationAtIndex(this.animationIndex); }
  get currentFrameIndex() { return this.currentAnimation[this.nextFrame].index; }
  get currentFrame() { return this.frameAtIndex(this.nextFrame); }
  get totalFrames() { return this.currentAnimation.length; }
  get totalAnimations() { return this.data.manifest.length; }

  isAnimationValid() {
    let animation = this.currentAnimation;
    if (!animation) return false;
    return animation.length > 0;
  }

  frameAtIndex(index) { return this.data.frames[this.currentAnimation[index].index]; }
  animationAtIndex(index) { return this.data.manifest[index]; }

  totalSlicesForAnimation(index) {
    let anim = this.animationAtIndex(index);
    if (!anim || anim.length == 0) {
      return 0;
    }
    let sprite = this.data.frames[anim[0].index];
    let height = sprite.frame.h;
    let maxHeight = World.tileDepth;
    return Math.ceil(height / maxHeight);
  }

  setAnimation(index) {
    let animation = this.animationAtIndex(index);
    if (!animation) {
      this.animationIndex = -1;
      this.nextFrame = -1;
      this.firstFrame = -1;
      return
    }

    this.animationIndex = index;
    this.nextFrame = 0;
  }

  advance() {
    this.nextFrame++;
    if (this.nextFrame == this.totalFrames) {
      this.nextFrame = 0;
      return true;
    } else {
      return false;
    }
  }

  draw(context, origin, zoom, sprite, part = -1) {

    /*
      Note about how alignment works:

      In the original DOS game, sprites were composed
      of multiple "elements" and the composited on to the screen
      relative to the desired location of the sprite.

      For the assets in this package the sprites have been re-composited
      into single image files which contain a buffer of empty space so that
      the entire sprite (i.e. all of its elements) can fit into the bounds of the image.

      In the final image atlas all sprites were trimmed of whitespace
      and merged into a single image to save space. This means we now
      need to use this original alignment to reconstruct the intended alignment.
    */

    let sourceX = sprite.frame.x;
    let sourceY = sprite.frame.y;
    let width = sprite.frame.w;
    let height = sprite.frame.h;

    let destX = origin.x + (sprite.spriteSourceSize.x - (sprite.sourceSize.w / 2)) * zoom;
    let destY = origin.y + (sprite.spriteSourceSize.y - (sprite.sourceSize.h / 2)) * zoom;

    // split sprite vertically
    if (part > -1) {
      // TODO: this is the z-offset between 0-1
      let ratio = 0;//z % 1;
      let maxHeight = World.tileDepth;
      let slice = maxHeight * (1 - ratio);
      let totalSlices = Math.ceil(height / maxHeight);
      if (part < totalSlices - 1) {
        let maxYOffset = height - ((part + 1) * slice);
        sourceY += maxYOffset;
        destY += maxYOffset * zoom;
        height = slice;
      } else if (part == totalSlices - 1) {
        height = height - ((totalSlices - 1) * slice);
      } else {
        return;
      }
    }

    let drawDebuggingRects = false;

    if (drawDebuggingRects) {
      let boundingOrigin = {
        x: origin.x - (sprite.sourceSize.w / 2),
        y: origin.y - (sprite.sourceSize.h / 2),
      }

      // untrimmed sprite rect
      context.strokeStyle = 'green';
      context.lineWidth = 1;
      context.strokeRect(boundingOrigin.x, boundingOrigin.y, sprite.sourceSize.w*zoom, sprite.sourceSize.h*zoom);

      // bounding sprite rect
      context.strokeStyle = 'blue';
      context.lineWidth = 1;
      context.strokeRect(destX, destY, width*zoom, height*zoom);
    }


    // draw image from atlas
    context.drawImage(sprite.image, 
      sourceX, sourceY, width, height,
      destX, destY, width*zoom, height*zoom);
  }

  static async loadFromFile(path) {

    let data = {
      frames: {},
      manifest: [],
      images: []
    };

    for (var i = 0; i < 2; i++) {

      // load TexturePacker json
      let json = await loadJSONFile(path+'/sprites-'+i+'.json');

      // load image for file
      data.images.push(await loadImage(path+'/sprites-'+i+'.png'));

      // merge frames into primary object
      let frames = json.frames;
      for (let key in frames) {
        // get the frame index from the sprite name
        let parts = key.split('_');
        let frameIndex = parts[2];
        data.frames[frameIndex] = frames[key];
        data.frames[frameIndex].image = data.images[i];
        data.frames[frameIndex].animation = parseInt(parts[1]);
      }
    }

    // read manifest into array
    let manifest = await loadJSONFile(path+'/animations.json');
    for (let key in manifest) {
      data.manifest.push(manifest[key]);
    }

    return new Sprites(data);
  }
}

async function loadImage(source) {
  let img = new Image();
  img.src = source;
  let _loadImage = async img => {
    return new Promise((resolve, reject) => {
        img.onload = async () => {
            resolve(true);
        };
    });
  };
  await _loadImage(img);
  return img;
};

async function loadJSONFile(path) {
  let data = null;
  await fetch(path)
    .then(response => response.json())
    .then(json => {
      data = json;
    });
  return data;
};
