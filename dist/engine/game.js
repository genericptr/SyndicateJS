export class Game {
	
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

	onKeyPressed(keyCode) { }

	isKeyDown(keyCode) { return this.keys[keyCode]; }

	update(deltaTime) {
	};

	render() {
	};

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

	_mainLoop(elapsedTime) {

		if (this.animationEnabled)
			window.requestAnimationFrame((t) => { this._mainLoop(t); });

		// compute delta time in seconds -- also cap it
		var deltaTime = (elapsedTime - this._previousElapsed) / 1000.0;
		deltaTime = Math.min(deltaTime, 0.25); // maximum delta of 250 ms
		this._previousElapsed = elapsedTime;		

		this.update(deltaTime);
		this.render();
	};

	processFrame() {
		this._mainLoop(0);
	}

	start() {
		this.processFrame();
	};

	unload() {
		window.removeEventListener('keydown', this.eventListeners.keydown);
		window.removeEventListener('keyup', this.eventListeners.keyup);
	};


	constructor(context) {
		
		// fields
		this._previousElapsed = 0;
		this.keys = [];
		// TODO: integer hashmap in JS?
		for (let i = 0; i < 1024; i++) this.keys[i] = false;

		this.ctx = context;
		this.animationEnabled = true;

		// keep the event listeners so they can be removed later
		this.eventListeners = {
			keydown: this.onKeyDown.bind(this),
			keyup: this.onKeyUp.bind(this)
		}
		window.addEventListener('keydown', this.eventListeners.keydown);
		window.addEventListener('keyup', this.eventListeners.keyup);
	}
}
