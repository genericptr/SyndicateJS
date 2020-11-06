
import { V2, V3, Rect } from './vectorMath.js';

export let World = {
  tileWidth: 0,
  tileHeight: 0,
  tileDepth: 0,
  tileDim: 0,
  screenRect: null,
  get screenWidth() { return this.screenRect.width; },
  get screenHeight() { return this.screenRect.height; },
  get halfTileWidth() { return this.tileWidth / 2; },
  get halfTileHeight() { return this.tileHeight / 2; },
}

// Camera

export let Camera = {
  origin: new V2(0, 0),
  zoom: 1.0
}

// http://clintbellanger.net/articles/isometric_math/

function worldToTile(x, y, z) {
  let result = new V3(
    x / World.tileDim,
    y / World.tileDim,
    z / World.tileDepth,
    );
  return result;
}

function tileToWorld(x, y, z) {
  let result = new V3(
      x * World.tileDim,
      y * World.tileDim,
      z * World.tileDepth,
    );
  return result;
}

function viewToWorld(x, y) {
  // offset view point to top-left of tile
  x -= World.halfTileWidth;
  y -= World.tileDepth;
  x -= (World.screenWidth / 2) - (World.halfTileWidth);

  let result = new V2(
      (x / World.tileWidth) + (y / World.tileHeight),
      (y / World.tileHeight) - (x / World.tileWidth)
    );

  // translate from tile coords
  result.x *= World.tileDim;
  result.y *= World.tileDim;

  return result;
}

function worldToView(x, y, z) {

  // convert pixel coords to tile coords
  let tileCoord = new V3(x / World.tileHeight, y / World.tileHeight, z / World.tileDepth);
  
  // convert tile coord to screen coords
  let result = new V2();
  result.x = (tileCoord.x - tileCoord.y) * World.halfTileWidth;
  result.y = (tileCoord.x + tileCoord.y) * World.halfTileHeight;
  result.y -= (tileCoord.z * World.tileDepth);

  // offset to top-left of bottom
  result.x += World.halfTileWidth;
  result.y += World.tileDepth;

  // center in screen
  result.x += (World.screenWidth / 2) - (World.halfTileWidth);

  return result;
}

function boundingViewRect(x, y, z, width, height) {
  let pt = worldToView(x, y, z);
  pt.x -= width / 2;
  pt.y -= height - (width / 2);

  // apply the camera transform
  // maybe not the best place but it's here for now
  pt.x -= Camera.origin.x - (World.screenWidth / 2);
  pt.y -= Camera.origin.y + 0;

  return new Rect(pt.x, pt.y, width, height);
}

export {
  worldToTile,
  viewToWorld,
  worldToView,
  boundingViewRect
}