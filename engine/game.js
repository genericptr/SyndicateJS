/**
 * game.js
 * This file is part of SyndicateJS
 * @license MIT
 * @author Ryan Joseph (November 2020)
 */

export class Game {
	
	// static methods

	static async loadImage(source) {
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

	// private methods

	_onMousemove(event) {
		let r = this.context.canvas.getBoundingClientRect();
		let x = event.clientX - r.x;
		let y = event.clientY - r.y;
		this.onMousemove(x, y);
	}

	_onMousedown(event) {
			let r = this.context.canvas.getBoundingClientRect();
			let x = event.clientX - r.x;
			let y = event.clientY - r.y;
			this.onMousedown(x, y);
		}

	_onTouchstart(event) {
		console.log(event);
		let r = this.context.canvas.getBoundingClientRect();
		let x = event.clientX - r.x;
		let y = event.clientY - r.y;
		this.onTouchstart(x, y);
		if (this.simulateMouseEvents) {
			this.onMousedown(x, y)
		}
	}

	_onTouchend(event) {
		let r = this.context.canvas.getBoundingClientRect();
		let x = event.clientX - r.x;
		let y = event.clientY - r.y;
		this.onTouchend(x, y);
	}

	_mainLoop(elapsedTime, once) {

		// request another frame
		if (!once && this.animationEnabled)
			window.requestAnimationFrame((t) => { this._mainLoop(t); });

		// compute delta time in seconds -- also cap it
		var deltaTime = (elapsedTime - this._previousElapsed) / 1000.0;
		deltaTime = Math.min(deltaTime, 0.25); // maximum delta of 250 ms
		this._previousElapsed = elapsedTime;		

		this.update(deltaTime);
		this.render();
	};

	// methods
	onKeyDown(event) {
		let keyCode = event.keyCode; 
		this.keys[keyCode] = true;
	};

	onKeyUp(event) {
		let keyCode = event.keyCode; 
		if (this.keys[keyCode]) {
			this.onKeyPressed(keyCode);
		}
		this.keys[keyCode] = false;
	};

	// public event stubs
	onMousemove(x, y) { }
	onMousedown(x, y) { }
	onTouchstart(x, y) { }
	onTouchend(x, y) { }
	onKeyPressed(keyCode) { }

	isKeyDown(keyCode) { return this.keys[keyCode]; }

	update(deltaTime) { };

	render() { };

	processFrame() {
		this._mainLoop(0, true);
	}

	start() {
		this._mainLoop(0, false);
	};

	unload() {
		window.removeEventListener('keydown', this.eventListeners.keydown);
		window.removeEventListener('keyup', this.eventListeners.keyup);
		window.removeEventListener('mousemove', this.eventListeners.mousemove);
		window.removeEventListener('mousedown', this.eventListeners.mousedown);
		window.removeEventListener('touchstart', this.eventListeners.touchstart);
		window.removeEventListener('touchend', this.eventListeners.touchend);
	};

	constructor(context) {
		console.log(context);

		// fields
		this._previousElapsed = 0;
		this.keys = [];
		// TODO: integer hashmap in JS?
		for (let i = 0; i < 1024; i++) this.keys[i] = false;

		this.context = context;
		this.animationEnabled = true;
		this.simulateMouseEvents = true;

		// keep the event listeners so they can be removed later
		this.eventListeners = {
			keydown: this.onKeyDown.bind(this),
			keyup: this.onKeyUp.bind(this),
			mousemove: this._onMousemove.bind(this),
			mousedown: this._onMousedown.bind(this),
			touchstart: this._onTouchstart.bind(this),
			touchend: this._onTouchend.bind(this),
		}
		
		window.addEventListener('keydown', this.eventListeners.keydown);
		window.addEventListener('keyup', this.eventListeners.keyup);
		window.addEventListener('mousemove', this.eventListeners.mousemove);
		window.addEventListener('mousedown', this.eventListeners.mousedown);
		window.addEventListener('touchstart', this.eventListeners.touchstart);
		window.addEventListener('touchend', this.eventListeners.touchend);
	}
}
