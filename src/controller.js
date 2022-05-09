import $ from "jquery";
import Konva from "konva";

/**
 * Global Variables
 */
class Player {
  constructor(id, name, num){
    this.id = id;
    this.name = name;
    this.num = num;
    this.x = randomX();
    this.y = randomY();
    this.obj = initPlayer(this.id, this.num);

  }

}
const myID = 'ID1';
let players = [];
const charSize = 70;
const velocity = 10;

/**
 * Stage : Ukuran canvas dan propertinya
 */
var stage = new Konva.Stage({
  container: 'canvascontainer',
  width: 1100,
  height: 700
});

/**
 * Base Layer : Tembok
 */
var baseLayer = new Konva.Layer();

Konva.Image.fromURL('/assets/tembok.png', function (tembok) {
  tembok.setAttrs({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  });
  baseLayer.add(tembok);
});


/**
 * Game Layer : Player, Enemy, Bullet
 */
var gameLayer = new Konva.Layer();

function initPlayer(id, num) {
  let char = null;
  var charObj = new Image();
  charObj.src = '/assets/char'+num+'.png';
  charObj.onload =  function () {
    char = new Konva.Image({
      x: randomX(),
      y: randomY(),
      image: charObj,
      width: charSize,
      height: charSize,
    });

    players[id].obj = char;

    baseLayer.add(char);

  };

}

players[myID] = new Player(myID, "Sisuka", 1)
// players.push(new Player("Sasuke", 2))

/**
 * Stage Adder : Tambahkan layer ke stage
 */

stage.add(baseLayer);
// stage.add(gameLayer)


/**
 * Helper : Anything
 */

function randomY() {
  return Math.random() * (stage.height()-charSize*2) + charSize;
}

function randomX() {
  return Math.random() * (stage.width()-charSize*2) + charSize;
}

/**
 * Loop and update the player position
 */
var anim = new Konva.Animation(function () {
  updatePlayers(myID)
}, baseLayer);
anim.start();

function updatePlayers(id) {
  let player = players[id];
  if(player.obj != null) {
    player.obj.x(player.x);
    player.obj.y(player.y);
  }
}

/**
 * Event Listener : Keyboard
 */
window.addEventListener('keydown', function(ev) {
  console.log(ev.key)
  if(ev.key == ' ' && ev.target == document.body) {
    ev.preventDefault();
  }

  switch (ev.key) {
    case 'w':
      players[myID].y-=velocity;
      break;
    case 'a':
      players[myID].x-=velocity;
      break;
    case 's':
      players[myID].y+=velocity;
      break;
    case 'd':
      players[myID].x+=velocity;
      break;
  
    default:
      break;
  }
});