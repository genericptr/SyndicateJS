/**
 * syndicate.js
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

import Game from './engine/game.js';
import Map from './map.js';
import Sprites from './sprites.js';
import { V2, V3, Rect } from './engine/vectorMath.js';
import { World, Camera, worldToTile, tileToWorld, viewToWorld, worldToView, screenToView, viewToScreen, boundingViewRect } from './engine/world.js';

/*
	Assets generated from libSyndicate and original DOS data files:
	http://icculus.org/libsyndicate/
*/

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


		// scroll by edge
		if (y < 32 && y >= 0) {
			console.log('move up');
			Camera.origin.y -= World.tileDim;
			this.processFrame();
			return
		} else if (x < 32 && x >= 0) {
			console.log('move left');
			Camera.origin.x -= World.tileDim;
			this.processFrame();
			return
		} else if (x > this.context.canvas.width - 32 && x <= this.context.canvas.width) {
			console.log('move right');
			Camera.origin.x += World.tileDim;
			this.processFrame();
			return
		} else if (y > this.context.canvas.height - 32 && x <= this.context.canvas.height) {
			console.log('move down');
			Camera.origin.y += World.tileDim;
			this.processFrame();
			return
		}

		// find the tile under the mouse
		let tile = this.findTileAtMouse(x, y);
		if (tile) {
			tile.__clicked = true;
			console.log(tile.x+','+tile.y+','+tile.z);

			// search up for tiles that have objects in them
			// and print them out for debugging
			for (let i = 0; i < 10; i++) {
				let above = this.map.tileAt(tile.x, tile.y, tile.z + i);
				if (above && above.objects.length > 0)
					console.log(above.objects);
			}

			this.processFrame();
		}
	}

	findTileAtMouse(x, y) {
		let at = screenToView(x, y);
		let mouseViewRect = new Rect(at.x, at.y, 1, 1);
		let hit = null;

		// search the quad tree for the mouse view rect
		let result = this.tileTree.retrieve(mouseViewRect);
		if (result.length > 0) {
			let hits = [];
			for (var i = 0; i < result.length; i++) {
				let node = result[i];
				
				// only consider tiles that were rendered on last pass
				// we do this so we don't capture tiles that were drawn
				// but now occluded by clipping
				if (node.tile.renderPass != this.renderPass) continue;

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

				// return the tile from the node
				hit = node.tile;
				break;
			}

			// this.processFrame();
		}

		return hit;
	}

	render() {
		let r = this.context.canvas.getBoundingClientRect();
		this.context.fillColor = 'black';
		this.context.fillRect(0, 0, r.width, r.height);
		this.renderPass += 1;
		this.drawMap(this.map);
	};

	drawTile(context, tile, worldPoint, atlas) {

		if (!atlas) throw 'invalid tile tile atlas!';

		let viewRect = boundingViewRect(worldPoint.x, worldPoint.y, worldPoint.z, atlas.tileWidth, atlas.tileHeight);
	 
	  // apply the camera transform
	  let origin = viewToScreen(viewRect.x, viewRect.y);
	  let screenRect = new Rect(origin.x, origin.y, viewRect.width * Camera.zoom, viewRect.height * Camera.zoom);
	  
	  // canvas has drawing artifacts if the rect is fractional
	  if (Camera.zoom != 0)
		  screenRect = screenRect.floor();

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
			}

			return viewRect;
		} else {
			return null;
		}
	}

	drawSprite(object, base) {

		// determine vertical slice
		let part = 0;
		if (base > object.level) {
			part = base - object.level;
		}

		let animationIndex = object.current_anim;

		// TODO: set the first frame also as an ABSOLUTE frame index

		this.sprites.setAnimation(animationIndex);

		if (!this.sprites.isAnimationValid())
			throw "animation invalid #"+animationIndex;

		let sprite = this.sprites.currentFrame;
		let worldPoint = tileToWorld(object.x, object.y, object.z);

		worldPoint.x += object.offset.x;
		worldPoint.y += object.offset.y;
		worldPoint.z += object.offset.z;

		let where = worldToView(worldPoint.x, worldPoint.y, worldPoint.z);
		where = viewToScreen(where.x, where.y);

		this.sprites.draw(this.context, where, Camera.zoom, sprite, part);
	}

	drawMap(map) {
		let depth = this.maxLevel;
		
		// make sure map max depth still wins
		if (depth > map.depth) depth = map.depth;

		let tileOrigin = viewToWorld(Camera.origin.x, Camera.origin.y);
		tileOrigin = worldToTile(tileOrigin.x, tileOrigin.y, 0);
		tileOrigin = tileOrigin.floor();

		// clip the top bounds
		let padding = 10;
		tileOrigin.x -= padding / Camera.zoom;
		tileOrigin.y -= padding / Camera.zoom;
		tileOrigin = tileOrigin.clamp(0, Number.MAX_SAFE_INTEGER);

		// overdraw to fill entire screen and rely on clipping
		// should be more clever about how to perform this however
		// let r = this.context.canvas.getBoundingClientRect();
		let maxX = (padding + Math.floor(this.context.canvas.height / (World.tileHeight / 2) - 1)) / Camera.zoom;
		let maxY = maxX;

		let startTime =  new Date();
		let total = 0;

		for (let z = 0; z < depth; z++) {
			for (let y = tileOrigin.y; y < tileOrigin.y + maxY; y++) {
				for (let x = tileOrigin.x; x < tileOrigin.x + maxX; x++) {
					let tile = map.tileAt(x, y, z);
					
					// invalid tile
					if (!tile) continue;

					// draw sprites
					for (var i = 0; i < tile.objects.length; i++) this.drawSprite(tile.objects[i], z);

					// only render solid tiles
					if (tile.solid) {
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
							tile.renderPass = this.renderPass;
							tile.__clicked = false;
						}
					}

				}
			}
		}

		let endTime = new Date();
		let s = 'Rendered '+total+' tiles in '+(endTime - startTime)+'ms';

		let element = document.querySelector('#game-stats');
		element.textContent = s;
		// console.log(s);
	}

	get maxLevel() {
		return this._maxLevel;
	}

	set maxLevel(newValue) {
		this._maxLevel = newValue;
		this.processFrame();
	}

	set zoomLevel(newValue) {
		Camera.zoom = newValue;
		this.processFrame();
	}

	async setup(mapFile, tilemap) {

		// warn the user that the browser window is not 1.0 devicePixelRatio
		let element = document.querySelector('#game-warnings');
		element.style.display = 'none';
		if (window.devicePixelRatio != 1) {
			element.style.display = 'block';
			element.innerHTML = '⚠️ Page zoom is '+(window.devicePixelRatio * 100)+'%';
		}

		// expand to fill height of document
		let html = document.documentElement;
		let bounds = this.context.canvas.getBoundingClientRect();
		this.context.canvas.height = html.clientHeight - bounds.top;

		// setup world
		let r = this.context.canvas.getBoundingClientRect();

		World.screenRect = new Rect(0, 0, r.width, r.height);
		World.tileWidth = 64;
		World.tileHeight = 32;
		World.tileDepth = 16;
		World.tileDim = 32;

		// load sprites
		this.sprites = await Sprites.loadFromFile('./assets/sprites');

		// load map from JSON
		await fetch('./assets/'+mapFile)
		  .then(response => response.json())
		  .then(json => {
		  	console.log('loaded map');
		  	this.map = new Map(json, this.sprites);
		  	// get the tileset from the map
		  	if (tilemap == 'default') {
		  		// palette is the same as 4 in the original DOS game
		  		if (json.palette == 5) 
		  			json.palette = 4;
		  		tilemap = 'tiles_'+json.palette+'.png';
		  	}
		  });


		// load tile map
		this.tileAtlas = new TileAtlas(await Game.loadImage('./assets/'+tilemap), 64, 48);

		// setup tile quad tree for mouse picking
		this.tileTree = new Quadtree({
		 	x: 0,
		 	y: 0,
		 	width: this.map.width * this.tileAtlas.tileWidth,
		 	height: this.map.height * this.tileAtlas.tileHeight
		 });
		console.log(this.tileTree);

		// setup camera
		Camera.origin = new V2(1572-100, 1732-300); // start point for "Western Europe"
		Camera.zoom = 2.0;

		// don't animate since we update with the array keys
		this.animationEnabled = false;

		// disable image interpolation for zooming
		this.context.imageSmoothingEnabled = false;

		this.maxLevel = this.map.depth;
		this.renderPass = 0;

		this.start();
	}
}
