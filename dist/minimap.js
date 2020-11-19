
import { Globals } from './globals.js';
import { SyndicateGame } from './syndicate.js';

// UI globals
let container = document.querySelector('#minimap-container');
let showMapsButton = document.querySelector('#show-maps');
let popup = document.querySelector('#map');

let canvas = document.getElementById('ctx');
let context = canvas.getContext('2d');

let cancelLoadingMinimaps = false;
let loadingMaps = false;
let minimapPanel = null;

function clickedBackground(event) {
  // console.log('clicked background');
  // console.log(event);

  // the click came from the show maps button
  if (event.target === showMapsButton) return;

  let node = event.target;
  let found = false;
  while (node) {
    if (node === container) {
      found = true;
      break;
    }
    node = node.parentNode;
  }

  // if the container wasn't found then close the panel
  if (!minimapPanel.isHidden() && !found) {
    minimapPanel.hide();
  }
}

class MinimapCanvas {

  static get cellSize() { return 256; }

  createCanvas() {

    // TODO: what's a better way to do this in vanilla js?
    let temp = document.createElement('template');
    temp.innerHTML = `<div class="minimap-frame"><canvas class="map-box"></canvas><p class="minimap-title"></p></div>`;

    // get title tag
    let frame = temp.content.firstChild;
    let title = frame.querySelector('p');
    title.innerHTML = this.name;

    frame.addEventListener('click', minimapPanel.openMap.bind(minimapPanel));
    frame.setAttribute('map', this.name);
    // frame.style['flex-grow'] = 0;
    // frame.style['flex-basis'] = '30%';

    frame.minimap = this;

    // get the context
    let context = frame.querySelector('canvas').getContext('2d');
    context.imageSmoothingEnabled = false;

    // note: I don't understand why we need to set both these properties
    context.canvas.width = MinimapCanvas.cellSize;
    context.canvas.height = MinimapCanvas.cellSize;
    context.canvas.style.width = context.canvas.width+'px';
    context.canvas.style.height = context.canvas.height+'px';

    // save fields
    this.frame = frame;
    this.context = context;
  }

  constructor(name) {
    this.name = name;
    this.frame = null;
    this.context = null;
    this.loaded = false;
    this.createCanvas();
  }
}

class MinimapPanel {

  resize() {    
    let screenRect = document.documentElement.getBoundingClientRect();

    let minWidth = MinimapCanvas.cellSize + 56;
    let minHeight = MinimapCanvas.cellSize + 84;

    let columns = Math.floor(screenRect.width / (minWidth * 1.1));
    let rows = Math.floor(screenRect.height / (minHeight * 1.0));

    let width = minWidth * columns;
    let height = minHeight * rows;

    container.style.width = width+'px';
    container.style.height = height+'px';
    container.style.marginLeft = -(width / 2)+'px';
    container.style.marginTop = -(height / 2)+'px';
  }

  isHidden() {
    return container.style.display == 'none';
  }

  toggle() {
    if (this.isHidden()) {
      this.showAndTransition();
    } else {
      this.hide();
    }
  }

  openMap(event) {

    let minimap = event.currentTarget.minimap;

    // TODO: this is stupid. we need to add the click
    // event to the correct element
    if (!event.target.classList.contains('map-box'))
      return;

    console.log('clicked map '+minimap.name);

    for (var i = 0; i < popup.options.length; i++) {
        if (popup.options[i].text == minimap.name)
            popup.options[i].selected = true;
    }

    if (Globals.game) Globals.game.unload();

    let game = new SyndicateGame(context);
    game.setup('maps/'+minimap.name+'.json');

    if (Globals.zoomCheckbox.checked) game.zoomLevel = 2.0;

    Globals.game = game;

    this.hide();
  }

  hide() {
    if (!this.isHidden()) {
      
      // clear css classes
      container.style.display = 'none';
      container.classList.remove('panel-transition');
      container.classList.remove('panel-transition-show');
      
      if (Globals.game) {
        Globals.game.disableMouseEvents = false;
      }
      if (loadingMaps) {
        cancelLoadingMinimaps = true;
      }
    }
  }

  async showAndTransition() {

    // don't reload
    if (loadingMaps) return;

    console.log('show maps');

    // show the div
    container.style.display = 'flex';
    container.classList.add('panel-transition-show');
    
    // add css transitions
    window.setTimeout((t) => {
      container.classList.remove('panel-transition-show');
      container.classList.add('panel-transition');
    }, 1);
    
    // TODO: safari/firefox are still not showing transition after first time
    // this doesn't seem to help
    container.addEventListener("transitionend", () => {
      this.show();
    });


  }

  async show() {

    loadingMaps = true;

    // disable clicking on map while we're loading
    Globals.game.disableMouseEvents = true;

    // create the minimap canvas'
    let count = popup.options.length;
    if (container.children.length == 0) {
      for (var i = 0; i < count; i++) {
        let minimap = new MinimapCanvas(popup.options[i].value);
        container.appendChild(minimap.frame);
      }
    }

    // render all
    for (var i = 0; i < container.children.length; i++) {
      let minimap = container.children[i].minimap;

      // load the minimap if needed
      if (!minimap.loaded)
        await Globals.game.renderMinimap(minimap.context, minimap.name);

      minimap.loaded = true;

      if (cancelLoadingMinimaps) {
        console.log('canceled loading maps');
        cancelLoadingMinimaps = false;
        break;
      }
    }

    console.log('finished loading maps');
    loadingMaps = false;
  }

  constructor() {
    this.resize();
  }
}

// create the shared instance
minimapPanel = new MinimapPanel();

// setup event handlers
showMapsButton.addEventListener('click', minimapPanel.toggle.bind(minimapPanel));
document.body.addEventListener('click', clickedBackground);

window.onresize = (e) => minimapPanel.resize();
window.keydown = (e) => minimapPanel.hide();

export {
  minimapPanel
}