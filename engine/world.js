/**
 * world.js
 * This file is part of SyndicateJS
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

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
  get viewOffset() {
    return new V2(this.origin.x - ((World.screenWidth / Camera.zoom) / 2), this.origin.y);
  },
  applyViewTransform(pt) {
    pt = pt.sub(this.viewOffset);
    pt.x *= Camera.zoom;
    pt.y *= Camera.zoom;
    return pt;
  },
  origin: new V2(0, 0),
  zoom: 1.0
}

function viewToScreen(x, y) {
  let viewOffset = Camera.viewOffset;
  return new V2(
      (x * camera.zoom) - viewOffset.x, 
      (y * camera.zoom) - viewOffset.y
  );
}

function screenToView(x, y) {
  return new V2((x / Camera.zoom) + Camera.viewOffset.x, (y / Camera.zoom) + Camera.viewOffset.y);
}

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

// http://clintbellanger.net/articles/isometric_math/

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
  return new Rect(pt.x, pt.y, width, height);
}

export {
  worldToTile,
  viewToWorld,
  worldToView,
  boundingViewRect,
  screenToView
}