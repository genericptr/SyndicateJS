import { Globals } from './globals.js';
import { SyndicateGame } from './syndicate.js';
import { minimapPanel } from './minimap.js';

let canvas = document.getElementById('ctx');
let context = canvas.getContext('2d');
let body = document.body;
let html = document.documentElement;

canvas.width = html.clientWidth;
canvas.height = 800;

function maxLevelChanged(input) {
  console.log('max level changed: '+input.target.value);
  if (Globals.game) 
    Globals.game.maxLevel = input.target.value;
}

function zoomCheckboxChanged(input) {
  console.log(input.target);
  if (Globals.game) {
    console.log(input.target.checked);
    if (input.target.checked) {
      Globals.game.zoomLevel = 2.0;
    } else {
      Globals.game.zoomLevel = 1.0;
    }
  }
}

function loadMap() {
  let map = document.querySelector('#map');
  let tileset = document.querySelector('#tileset');

  console.log('change map '+map.options[map.selectedIndex].value+' tiles '+tileset.options[tileset.selectedIndex].value);

  if (Globals.game) Globals.game.unload();

  let game = new SyndicateGame(context);
  game.setup('maps/'+map.options[map.selectedIndex].textContent+'.json', tileset.options[tileset.selectedIndex].value);
  
  if (Globals.zoomCheckbox.checked) game.zoomLevel = 2.0;

  Globals.game = game;
}

// set the default map index
let map = document.querySelector('#map');
map.selectedIndex = 0;

// hook up event listeners
document.querySelector('#load-map').addEventListener('click', loadMap);
document.querySelector('#max-level').addEventListener('input', maxLevelChanged);

document.querySelector('#game-warnings').style.display = 'none';

let zoomCheckbox = document.querySelector('#zoom-2x');
zoomCheckbox.addEventListener('change', zoomCheckboxChanged);
zoomCheckbox.checked = true;
Globals.zoomCheckbox = zoomCheckbox;

loadMap();

minimapPanel.hide();

// todo: only load once the game has been loaded and first frame is drawn
// we need a callback or something to let us know we got this far
// window.setTimeout(minimapPanel.showAndTransition.bind(minimapPanel), 1000);