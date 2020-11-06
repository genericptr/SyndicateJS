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
