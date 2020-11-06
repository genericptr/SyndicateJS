import { Game } from './engine/game.js';
import { V2, V3, Rect } from './engine/vectorMath.js';
import { World, Camera, worldToTile, viewToWorld, worldToView, boundingViewRect } from './engine/world.js';

/*
	Assets generated from libSyndicate and original DOS data files:
	http://icculus.org/libsyndicate/
*/

// Map

class Map {
	constructor(json) {
		let width = 128;
		let height = 96;
		let depth = 12;   // TODO: search max z from tiles

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
			map.push(tile);

			x += 1;
			if (x == width) {
				x = 0;
				y += 1;
			}

			if (y == height) {
		    x = 0;
		    y = 0;
		    z += 1;
			}
		}
		this.tiles = map;
	}
}

// TileAtlas

class TileAtlas {

	drawTile(ctx, tileID, worldPoint) {
		let tilePoint = this.tileIndicies[tileID];
		let r = boundingViewRect(worldPoint.x, worldPoint.y, worldPoint.z, this.tileWidth, this.tileHeight);

		// check if rect is actually in screen bounds
		if (r.interesects(World.screenRect)) {
			ctx.drawImage(this.image, 
										tilePoint.x * this.tileWidth, tilePoint.y * this.tileHeight, this.tileWidth, this.tileHeight,
										r.x, r.y, r.width, r.height);

			return true;
		} else {
			return false;
		}
	}

	constructor(image, tileWidth, tileHeight) {
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


	render() {
		this.ctx.clearRect(0, 0, 512, 512);
		this.drawMap(this.map);
	};

	drawMap(map) {
		let width = 128;
		let height = 96;
		let depth = this.maxLevel;

		let tileOrigin = viewToWorld(Camera.origin.x, Camera.origin.y);
		tileOrigin = worldToTile(tileOrigin.x, tileOrigin.y, 0);
		tileOrigin = tileOrigin.floor();
		// clip the top bounds
		tileOrigin.x -= 4;
		tileOrigin.y -= 4;
		tileOrigin = tileOrigin.clamp(0, Number.MAX_SAFE_INTEGER);
		// overdraw to fill entire screen and rely on clipping
		// should be more clever about how to perform this however
		let maxX = 26;
		let maxY = 26;

		let startTime =  new Date();
		let total = 0;

		for (let z = 0; z < depth; z++) {
			for (let y = tileOrigin.y; y < tileOrigin.y + maxY; y++) {
				for (let x = tileOrigin.x; x < tileOrigin.x + maxX; x++) {
					let tileIndex = (x + y * width) + (z * width * height);
					let tile = map.tiles[tileIndex];
					if (this.tiles.drawTile(this.ctx, tile.tileID, new V3(x * World.tileDim, y * World.tileDim, z * World.tileDepth))) {
						total++;
					}
				}
			}
		}

		let endTime = new Date();
		let s = 'rendered '+total+' tiles in '+(endTime - startTime)+'ms';

		let p = document.querySelector('#render-stats');
		p.textContent = s;
		console.log(s);
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
		this.tiles = new TileAtlas(await Game.loadImage('./assets/'+tilemap), 64, 48);

		// setup world
		World.screenRect = new Rect(0, 0, ctx.width, ctx.height);
		World.tileWidth = 64;
		World.tileHeight = 32;
		World.tileDepth = 16;
		World.tileDim = 32;

		// setup camera
		Camera.origin = new V2(1572, 1732); // start point for "Western Europe"
		Camera.zoom = 1.0;

		// don't animate since we update with the array keys
		this.animationEnabled = false;

		this.maxLevel = 12;

		this.start();
	}
}
