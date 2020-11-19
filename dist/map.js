/**
 * map.js
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

import { World } from './engine/world.js';

const ObjectSubTypes = {
  0x01: "Phone booth",
  0x05: "Ped Cross Light",0x06: "Ped Cross Light",0x07: "Ped Cross Light",0x08: "Ped Cross Light",
  0x12: "Open Window",
  0x13: "Closed Window",
  0x13: "Damaged Window",
  0x20: "Window",0x21: "Window",0x23: "Window",0x24: "Window",0x25: "Window",
  0x16: "Tree",
  0x19: "Trash bin",
  0x1A: "Mail box",
  0x1F: "Poster",
  0x0A: "Neon Sign",
  0x0C: "Closed Door",0x0D: "Closed Door",
  0x0E: "Opening Door",0x0F: "Opening Door",
  0x26: "Large Door"
}

const ObjectTypes = {
  0x01: "Ped",
  0x02: "Vehicle",
  0x03: "Sfx",
  0x04: "Weapon",
  0x05: "Object",
};

const WeaponNames = {
  0x01: "Persuadertron",
  0x02: "Pistol", // air raid com
  0x03: "Gauss Gun",
  0x04: "Shotgun",
  0x05: "Uzi",
  0x06: "Minigun",
  0x07: "Laser",
  0x08: "Flamer",
  0x09: "Long Range",
  0x0A: "Scanner",
  0x0B: "Medikit",
  0x0C: "Time Bomb",
  0x0D: "Access Card", // clone shield
  0x0E: "Invalid",
  0x0F: "Invalid",
  0x10: "Invalid",
  0x11: "Energy Shield",
};

// from 0xF0 to 0x10 : south
// from 0x10 to 0x30 : south-east
// from 0x30 to 0x50 : east
// from 0x50 to 0x70 : east-north
// from 0x70 to 0x90 : north
// from 0x90 to 0xB0 : north-west
// from 0xB0 to 0xD0 : west
// from 0xD0 to 0xF0 : west-south

const MapColumns = {
  None: 0,
  SlopeSN: 1,
  SlopeNS: 2,
  SlopeEW: 3,
  SlopeWE: 4,
  Ground: 5,
  RoadSideEW: 6,
  RoadSideWE: 7,
  RoadSideSN: 8,
  RoadSideNS: 9,
  Wall: 10,
  RoadCurve: 11,
  HandrailLight: 12,
  Roof: 13,
  RoadPedCross: 14,
  RoadMark: 15,
  NbTypes: 16,
};

const AgentNames = [
  "AFSHAR","AARNOLD","EBAIRD","LTBALDWIN","BLACK","BOYD","PLABOYESEN","BRAZIER","BROWN","R","BUSH","CARR","PLACHRISMAS",
  "CLINTON","COOPER","ECORPES","TCOX","DAWSON","EDONKIN","TDISKETT","DUNNE","EDGAR","LAEVANS","FAIRLEY","FAWCETT","FLINT",
  "LTFLOYD","GRIFFITHS","YDHARRIS","EHASTINGS","HERBERT","HICKMAN","HICKS","LAHILL","MASJAMES","INJEFFERY","JOESEPH",
  "JOHNSON","JOHNSTON","ONKJONES","SKLEWIS","NNLINDSELL","LALOCKLEY","MARTIN","MCENTEE","MCLAUGHIN","OYMOLYNEUX",
  "ITHMUNRO","RRMORRIS","TMUMFORD","NIXON","PARKER","PRATT","LAREID","MASRENNIE","NRICE","RIPLEY","ROBERTSON","HNROMANO",
  "KSEAT","SKSEN","SHAW","INDSIMMONS","SNELLING","TAYLOR","TROWERS","WEBLEY","IWELLESLEY","UXWILD","UNRWILLIS"
];

/*
  direction for selected number of surfaces
*/
function getDirection(dir_, snum = 8) {
  let direction = 0;
  let sinc = 256 / snum;
  let sdec = sinc / 2;
  while (direction < snum) {
    let s = direction * sinc;
    if (direction == 0) {
        if ((256 - sdec) <= dir_ || (s + sdec) > dir_)
            break;
    } else if ((s - sdec) <= dir_ && (s + sdec) > dir_)
        break;
    direction++;
  }
  return direction;
}

export default class Map {

  tileIndex(x, y, z) {
    return (x + y * this.width) + (z * this.width * this.height);
  }

  tileAt(x, y, z) {
    return this.tiles[this.tileIndex(x, y, z)];
  }

  addObject(object) {

    // offset up to draw into tile above
    object.level = object.z;

    // save the originals for debugging
    object._orientation = object.orientation;
    object._type = object.type;
    object._sub_type = object.sub_type;

    object.orientation = parseInt(object.orientation);
    object.type = parseInt(object.type);
    object.sub_type = parseInt(object.sub_type);

    // get sub tile
    object.offset = { x: Math.floor(World.tileDim * (object.subX / 256)), 
                      y: Math.floor(World.tileDim * (object.subY / 256)),
                      z: Math.floor(World.tileDim * (object.subZ / 256))
                    };

    if (object.subZ > 0) {
      object.level++;
    }

    // add slices vertically
    let slices = this.sprites.totalSlicesForAnimation(object.current_anim);
    for (let i = 0; i < slices; i++) {
      let tile = this.tileAt(object.x, object.y, object.level + i);
      // if this happens we need to add more vertical levels for padding
      if (!tile) {
        // console.log('*** invalid level '+(object.level + i)+' for object');
        // console.log(object);
        continue;
      }
      tile.objects.push(object);
    }
  }

  setup() {

    // these are the "column" names as specified in the file format
    this.columns = {
      None: 0,
      SlopeSN: 1,
      SlopeNS: 2,
      SlopeEW: 3,
      SlopeWE: 4,
      Ground: 5,
      RoadSideEW: 6,
      RoadSideWE: 7,
      RoadSideSN: 8,
      RoadSideNS: 9,
      Wall: 10,
      RoadCurve: 11,
      HandrailLight: 12,
      Roof: 13,
      RoadPedCross: 14,
      RoadMark: 15,
      NbTypes: 16,
    };

  }

  constructor(json, sprites) {
    this.width = 128;
    this.height = 96;
    this.depth = 15;   // TODO: search max z from tiles

    this.minX = json.minX;
    this.minY = json.minY;
    this.maxX = json.maxX;   
    this.maxY = json.maxY;   

    this.setup();

    let tiles = json.tiles;
    let columns = json.columns;
    this.sprites = sprites;

    let x = 0;
    let y = 0;
    let z = 0;

    let map = [];

    for (let i = 0; i < tiles.length; i++) {

      let tile = {
        tileID: tiles[i],
        column: columns[tiles[i]],
        objects: [],
        x: x,
        y: y,
        z: z,
      };

      // determine if the tile is solid or not
      if (tile.column != this.columns.None && tile.column != this.columns.NbTypes) {
        tile.solid = true;
      }

      // get the tile slope
      if (tile.column == this.columns.SlopeSN ||
          tile.column == this.columns.SlopeNS ||
          tile.column == this.columns.SlopeEW ||
          tile.column == this.columns.SlopeWE) {
        tile.sloped = true;
      }


      map.push(tile);

      // next column
      x += 1;
      if (x == this.width) {
        x = 0;
        y += 1;
      }

      // next row
      if (y == this.height) {
        x = 0;
        y = 0;
        z += 1;
      }
    }

    // add extra empty tiles for level for padding
    let maxTileLevel = z;
    for (let z = maxTileLevel; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          map.push({
            tileID: 0,
            column: 0,
            objects: [],
            x: x,
            y: y,
            z: z,
          });
        }
      }
    }

    this.tiles = map;

    // add objects
    for (var i = 0; i < json.objects.length; i++) {
      if (json.objects[i].subZ > 0) {
        json.objects[i].z--;
      }
      this.addObject(json.objects[i]);
    }
    for (var i = 0; i < json.pedestrians.length; i++) {
      // TODO: for pedestrians on slopes we need to add +1 for some reason
      if (json.pedestrians[i].subZ > 0) {
        json.pedestrians[i].z--;
      }
      this.addObject(json.pedestrians[i]);
    }
    for (var i = 0; i < json.vehicles.length; i++) this.addObject(json.vehicles[i]);

    // note: weapons are meant to be picked up by peds
    // because there is no inventory in the peds data files  
    // for (var i = 0; i < json.weapons.length; i++) this.addObject(json.weapons[i]);

  }
}