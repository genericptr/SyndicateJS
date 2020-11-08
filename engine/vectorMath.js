/**
 * vectorMath.js
 * This file is part of SyndicateJS
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

export class V2 {
  floor() {
    return new V2(
      Math.floor(this.x),
      Math.floor(this.y),
    );
  }
  clamp(min, max) {
    return new V2(
      Math.min(Math.max(this.x, min), max),
      Math.min(Math.max(this.y, min), max),
    );
  }
  add(rhs) { return new V2(this.x + rhs.x, this.y + rhs.y); }
  sub(rhs) { return new V2(this.x - rhs.x, this.y - rhs.y); }
  mul(rhs) { return new V2(this.x * rhs.x, this.y * rhs.y); }
  div(rhs) { return new V2(this.x / rhs.x, this.y / rhs.y); }
  mod(rhs) { return new V2(this.x % rhs.x, this.y % rhs.y); }
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

export class V3 {
  floor() {
    return new V3(
      Math.floor(this.x),
      Math.floor(this.y),
      Math.floor(this.z),
    );
  }
  clamp(min, max) {
    return new V3(
      Math.min(Math.max(this.x, min), max),
      Math.min(Math.max(this.y, min), max),
      Math.min(Math.max(this.z, min), max),
    );
  }
  add(rhs) { return new V2(this.x + rhs.x, this.y + rhs.y,  this.z + rhs.z); }
  sub(rhs) { return new V2(this.x - rhs.x, this.y - rhs.y,  this.z - rhs.z); }
  mul(rhs) { return new V2(this.x * rhs.x, this.y * rhs.y,  this.z * rhs.z); }
  div(rhs) { return new V2(this.x / rhs.x, this.y / rhs.y,  this.z / rhs.z); }
  mod(rhs) { return new V2(this.x % rhs.x, this.y % rhs.y,  this.z % rhs.z); }
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Rect {

  get minX() { return this.x; }
  get minY() { return this.y; }
  get maxX() { return this.x + this.width; }
  get maxY() { return this.y + this.height; }

  floor() {
    return new Rect(
      Math.floor(this.x),
      Math.floor(this.y),
      Math.floor(this.width),
      Math.floor(this.height),
    );
  }

  interesects(rect) {
    return ((this.minX < rect.maxX) && 
            (this.maxX > rect.minX) && 
            (this.minY < rect.maxY) && 
            (this.maxY > rect.minY));
  }

  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}
