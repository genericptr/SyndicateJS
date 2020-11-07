/**
 * syndicate.js
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

import { Game } from './engine/game.js';
import { V2, V3, Rect } from './engine/vectorMath.js';
import { World, Camera, worldToTile, viewToWorld, worldToView, screenToView, boundingViewRect } from './engine/world.js';

/*
	Assets generated from libSyndicate and original DOS data files:
	http://icculus.org/libsyndicate/
*/

// Map

class Map {

	tileIndex(x, y, z) {
		return (x + y * this.width) + (z * this.width * this.height);
	}

	tileAt(x, y, z) {
		return this.tiles[this.tileIndex(x, y, z)];
	}

	constructor(json) {
		this.width = 128;
		this.height = 96;
		this.depth = this.maxLevel;   // TODO: search max z from tiles

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

		let tiles = json.data.tiles;
		let columns = json.columns;

		let x = 0;
		let y = 0;
		let z = 0;

		let map = [];

		for (let i = 0; i < tiles.length; i++) {

			let tile = {
				tileID: tiles[i],
				column: columns[tiles[i]],
				x: x,
				y: y,
				z: z,
			};

			// determine if the tile is solid or not
			if (tile.column != this.columns.None && tile.column != this.columns.NbTypes) {
				tile.solid = true;
			}

			map.push(tile);

			x += 1;
			if (x == this.width) {
				x = 0;
				y += 1;
			}

			if (y == this.height) {
		    x = 0;
		    y = 0;
		    z += 1;
			}
		}

		this.tiles = map;
	}
}

// TileAtlas

// TODO: move to game.js
class TileAtlas {


	getPixel(x, y) {
		// sample of integer values
		x = Math.floor(x);
		y = Math.floor(y);
		if (!this.canvas) {
			// create 2d canvas for pixel sampling
			this.canvas = document.createElement('canvas');
			this.canvas.width = this.image.width;
			this.canvas.height = this.image.height;
			this.canvas.getContext('2d').drawImage(this.image, 0, 0, this.image.width, this.image.height);
		}
		return this.canvas.getContext('2d').getImageData(x, y, 1, 1).data;
	}

	constructor(image, tileWidth, tileHeight) {

		// public properties
		this.image = image;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;

		// TODO: how get the components from the linear index?
		// let row = Math.floor(tileMapSize.width * (index / (tileMapSize.x * tileMapSize.y)));
		this.mapSize = new V2(Math.floor(this.image.width / this.tileWidth), Math.floor(this.image.height / this.tileHeight));		
		this.tileIndicies = [];
		for (let y = 0; y < this.mapSize.y; y++) {
			for (let x = 0; x < this.mapSize.x; x++) {
				this.tileIndicies.push(new V2(x, y));
			}
		}
	}
}


export class SyndicateGame extends Game {

	onKeyPressed(keyCode) {
		switch (keyCode) {
			case 68: 
				Camera.origin.x += World.tileDim;
				this.processFrame();
				break;
			case 65: 
				Camera.origin.x -= World.tileDim;
				this.processFrame();
				break;
			case 83: 
				Camera.origin.y += World.tileDim;
				this.processFrame();
				break;
			case 87: 
				Camera.origin.y -= World.tileDim;
				this.processFrame();
				break;
		}
	}

	onMousedown(x, y) {
		let at = screenToView(x, y);
		let mouseViewRect = new Rect(at.x, at.y, 1, 1);

		// search the quad tree for the mouse view rect
		let result = this.tileTree.retrieve(mouseViewRect);
		if (result.length > 0) {
			let hits = [];
			for (var i = 0; i < result.length; i++) {
				let node = result[i];
				let r = new Rect(node.x, node.y, node.width, node.height);
				if (r.interesects(mouseViewRect)) {
					hits.push(node);
				}
			}

			// sort by sort index which is saved in the node
			hits.sort((a, b) => {
				if (a.sortIndex > b.sortIndex) {
					return -1;
				} else if (a.sortIndex < b.sortIndex) {
					return 1;
				} else {
					return 0;
				}
			})

			// search the sorted list from top to bottom
			// and sample into the atlas to ignore transparent pixels
			for (let i in hits) {
				let node = hits[i];

				// tile was not yet rendered
				if (!node.tile.imageSourceRect)
					 continue;

				let tileViewRect = new Rect(node.x, node.y, node.width, node.height);
				let offset = new V2(at.x - node.x, at.y - node.y);

				// add the tile source image rect to offset into the tile atlas
				offset.x += node.tile.imageSourceRect.x;
				offset.y += node.tile.imageSourceRect.y;

				let pixel = this.tileAtlas.getPixel(offset.x, offset.y);

				// alpha channel is below the threshold for transparency
				if (pixel[3] < 100) {
					continue;
				}

				// mark the node as clicked
				node.tile.__clicked = true;
				break;
			}

			this.processFrame();
		}
	}

	render() {
		let r = this.context.canvas.getBoundingClientRect();
		this.context.clearRect(0, 0, r.width, r.height);
		this.drawMap(this.map);
	};

	drawTile(context, tile, worldPoint, atlas) {

		if (!atlas) throw 'invalid tile tile atlas!';

		let viewRect = boundingViewRect(worldPoint.x, worldPoint.y, worldPoint.z, atlas.tileWidth, atlas.tileHeight);
	 
	  // apply the camera transform
	  // TODO: clean this up. so wasteful...
	  let origin = Camera.applyViewTransform(new V2(viewRect.x, viewRect.y));
	  let screenRect = new Rect(origin.x, origin.y, viewRect.width, viewRect.height);

		// check if rect is actually in screen bounds
		if (screenRect.interesects(World.screenRect)) {
			
			// get the image source rect in the tile atlas and 
			// save into the tile for later use
			if (!tile.imageSourceRect) {
				let tilePoint = atlas.tileIndicies[tile.tileID];
				tile.imageSourceRect = new Rect(tilePoint.x * atlas.tileWidth, tilePoint.y * atlas.tileHeight, atlas.tileWidth, atlas.tileHeight);
			}
			let sourceRect = tile.imageSourceRect;

			context.drawImage(atlas.image, 
										sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
										screenRect.x, screenRect.y, screenRect.width, screenRect.height);

			// DEBBUGING
			if (tile.__clicked) {
				context.globalAlpha = 0.5;
				context.globalCompositeOperation = "xor";
				context.drawImage(atlas.image, 
											sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
											screenRect.x, screenRect.y, screenRect.width, screenRect.height);
				context.globalCompositeOperation = "source-over";
				context.globalAlpha = 1;
				// context.strokeStyle = 'red';
				// context.lineWidth = 1;
				// context.imageSmoothingEnabled = false;
				// context.strokeRect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
			}

			return viewRect;
		} else {
			return null;
		}
	}

	drawMap(map) {
		let depth = this.maxLevel;

		let tileOrigin = viewToWorld(Camera.origin.x, Camera.origin.y);
		tileOrigin = worldToTile(tileOrigin.x, tileOrigin.y, 0);
		tileOrigin = tileOrigin.floor();
		// clip the top bounds
		tileOrigin.x -= 6;
		tileOrigin.y -= 6;
		tileOrigin = tileOrigin.clamp(0, Number.MAX_SAFE_INTEGER);

		// overdraw to fill entire screen and rely on clipping
		// should be more clever about how to perform this however
		// let r = this.context.canvas.getBoundingClientRect();
		let maxX = 32;
		let maxY = 32;

		let startTime =  new Date();
		let total = 0;

		for (let z = 0; z < depth; z++) {
			for (let y = tileOrigin.y; y < tileOrigin.y + maxY; y++) {
				for (let x = tileOrigin.x; x < tileOrigin.x + maxX; x++) {
					let tile = map.tileAt(x, y, z);

					// the tile is not solid so we don't want to render
					if (!tile.solid) continue;

					let viewRect = null;
					if (viewRect = this.drawTile(this.context, tile, new V3(x * World.tileDim, y * World.tileDim, z * World.tileDepth), this.tileAtlas)) {
						// add the tile to the quad tree
						if (!tile.treeNode) {
							// add a reference to the tile in the tree node
							tile.treeNode = {	...viewRect, 
																tile: tile,
																sortIndex: map.tileIndex(x, y, z)
															};
							this.tileTree.insert(tile.treeNode);
						}
						total++;
						tile.__clicked = false;
					}
				}
			}
		}

		let endTime = new Date();
		let s = 'rendered '+total+' tiles in '+(endTime - startTime)+'ms';

		let p = document.querySelector('#render-stats');
		p.textContent = s;
		// console.log(s);
	}

	get maxLevel() {
		return this._maxLevel;
	}

	set maxLevel(newValue) {
		this._maxLevel = newValue;
		this.processFrame();
	}

	async setup(mapFile, tilemap) {

		// load map from JSON
		await fetch('./assets/'+mapFile)
		  .then(response => response.json())
		  .then(json => {
		  	console.log('loaded map');
		  	this.map = new Map(json);
		  	// get the tileset from the map
		  	if (tilemap == 'default') {
		  		// palette is the same as 4 in the original DOS game
		  		if (json.data.palette == 5) 
		  			json.data.palette = 4;
		  		tilemap = 'tiles_'+json.data.palette+'.png';
		  	}
		  });

		// load tile map
		this.tileAtlas = new TileAtlas(await Game.loadImage('./assets/'+tilemap), 64, 48);

		// setup world
		let r = this.context.canvas.getBoundingClientRect();

		World.screenRect = new Rect(0, 0, r.width, r.height);
		World.tileWidth = 64;
		World.tileHeight = 32;
		World.tileDepth = 16;
		World.tileDim = 32;

		// setup tile quad tree for mouse picking
		this.tileTree = new Quadtree({
		 	x: 0,
		 	y: 0,
		 	width: this.map.width * this.tileAtlas.tileWidth,
		 	height: this.map.height * this.tileAtlas.tileHeight
		 });
		console.log(this.tileTree);

		// setup camera
		Camera.origin = new V2(1572, 1732); // start point for "Western Europe"
		Camera.zoom = 1.0;

		// don't animate since we update with the array keys
		this.animationEnabled = false;

		this.maxLevel = 12;

		this.start();
	}
}
